// Autor: Rodrigo Gabi - RA: 25001714
// Data: 12/11/2026
// Descrição: Consultas de escrita (INSERT e UPDATE) usadas pelas rotas de
// demandas. Toda alteração que precisa entrar no histórico é gravada na
// mesma transação da demanda: ou grava as duas coisas, ou nenhuma.
// Os valores sempre vão por "?" (consulta parametrizada).

import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { pool } from "./conexao.js";
import type { Demanda, TipoAlteracao } from "../types/modelos.js";

// Uma linha do histórico: o que mudou e os valores antes/depois (como texto)
export interface Alteracao {
  tipo: TipoAlteracao;
  anterior: string | null;
  novo: string | null;
}

export interface NovaDemanda {
  titulo: string;
  descricao: string;
  tipo: Demanda["tipo"];
  prioridade: Demanda["prioridade"];
  projetoId: number;
  responsavelId: number | null;
  prazoFinalizacao: string | null;
}

// Campos que podem ser alterados; só os informados entram no UPDATE
export interface CamposDemanda {
  titulo?: string;
  descricao?: string;
  tipo?: Demanda["tipo"];
  prioridade?: Demanda["prioridade"];
  status?: Demanda["status"];
  projetoId?: number;
  responsavelId?: number | null;
  prazoFinalizacao?: string | null;
}

// Trecho do SET de cada campo. Tipo, prioridade e status chegam pelo nome
// e são convertidos para o id da tabela de domínio com uma subconsulta.
const COLUNAS: Record<keyof CamposDemanda, string> = {
  titulo: "titulo = ?",
  descricao: "descricao = ?",
  tipo: "tipo_id = (SELECT id FROM tipo_demanda WHERE nome = ?)",
  prioridade: "prioridade_id = (SELECT id FROM prioridade WHERE nome = ?)",
  status: "status_id = (SELECT id FROM status_demanda WHERE nome = ?)",
  projetoId: "projeto_id = ?",
  responsavelId: "responsavel_id = ?",
  prazoFinalizacao: "prazo_finalizacao = ?",
};

async function emTransacao<T>(executar: (con: PoolConnection) => Promise<T>): Promise<T> {
  const con = await pool.getConnection();
  try {
    await con.beginTransaction();
    const resultado = await executar(con);
    await con.commit();
    return resultado;
  } catch (erro) {
    await con.rollback();
    throw erro;
  } finally {
    con.release();
  }
}

async function registrarHistorico(
  con: PoolConnection,
  demandaId: number,
  usuarioId: number,
  alteracao: Alteracao
): Promise<void> {
  const [resultado] = await con.query<ResultSetHeader>(
    `INSERT INTO historico_alteracao
       (demanda_id, usuario_id, tipo_alteracao_id, valor_anterior, valor_novo)
     SELECT ?, ?, id, ?, ? FROM tipo_alteracao WHERE nome = ?`,
    [demandaId, usuarioId, alteracao.anterior, alteracao.novo, alteracao.tipo]
  );
  // Se o tipo não existir na tabela, nada é inserido: melhor falhar do que perder o registro
  if (resultado.affectedRows !== 1) {
    throw new Error(`Tipo de alteração desconhecido: ${alteracao.tipo}`);
  }
}

// Cria a demanda com status "Aberta" e devolve o id gerado
export async function criarDemanda(
  dados: NovaDemanda,
  criadorId: number,
  alteracoes: Alteracao[]
): Promise<number> {
  return emTransacao(async (con) => {
    const [resultado] = await con.query<ResultSetHeader>(
      `INSERT INTO demanda
         (titulo, descricao, tipo_id, prioridade_id, status_id,
          projeto_id, responsavel_id, criador_id, prazo_finalizacao)
       SELECT ?, ?, t.id, pr.id, s.id, ?, ?, ?, ?
       FROM tipo_demanda t
       JOIN prioridade pr ON pr.nome = ?
       JOIN status_demanda s ON s.nome = 'Aberta'
       WHERE t.nome = ?`,
      [
        dados.titulo, dados.descricao, dados.projetoId, dados.responsavelId,
        criadorId, dados.prazoFinalizacao, dados.prioridade, dados.tipo,
      ]
    );
    if (resultado.affectedRows !== 1) {
      throw new Error("Tipo ou prioridade não encontrados ao criar a demanda");
    }
    for (const alteracao of alteracoes) {
      await registrarHistorico(con, resultado.insertId, criadorId, alteracao);
    }
    return resultado.insertId;
  });
}

// Altera os campos informados e registra as alterações no histórico.
// Usada pelo PUT, pela troca de status e pelo cancelamento.
export async function atualizarDemanda(
  demandaId: number,
  usuarioId: number,
  campos: CamposDemanda,
  alteracoes: Alteracao[]
): Promise<void> {
  const trechos = ["atualizada_em = CURRENT_TIMESTAMP"];
  const valores: unknown[] = [];
  for (const [campo, valor] of Object.entries(campos)) {
    if (valor === undefined) continue;
    trechos.push(COLUNAS[campo as keyof CamposDemanda]);
    valores.push(valor);
  }

  await emTransacao(async (con) => {
    await con.query(`UPDATE demanda SET ${trechos.join(", ")} WHERE id = ?`, [...valores, demandaId]);
    for (const alteracao of alteracoes) {
      await registrarHistorico(con, demandaId, usuarioId, alteracao);
    }
  });
}

export async function adicionarComentario(demandaId: number, usuarioId: number, texto: string): Promise<void> {
  await pool.query(
    "INSERT INTO comentario (demanda_id, usuario_id, texto) VALUES (?, ?, ?)",
    [demandaId, usuarioId, texto]
  );
}
