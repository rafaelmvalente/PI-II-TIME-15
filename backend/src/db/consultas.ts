// Autor: Rodrigo Gabi - RA: 25001714
// Data: 07/11/26
// Descrição: Consultas ao banco usadas pelas rotas. Cada função devolve o mesmo
// formato de objeto que o antigo data/dados.ts, então as rotas quase não mudam.
// Todas usam "?" para os valores (consulta parametrizada), nunca texto concatenado.

import type { RowDataPacket } from "mysql2";
import { pool } from "./conexao.js";
import type {
  Comentario,
  Demanda,
  EventoHistorico,
  Projeto,
  TipoAlteracao,
  Usuario,
  UsuarioResumo,
} from "../types/modelos.js";

// SELECT-base da demanda: traz os NOMES (tipo, prioridade, status) com JOIN e
// renomeia as colunas para o padrão do código (projeto_id -> projetoId etc.).
const SELECT_DEMANDA = `
SELECT d.id, d.titulo, d.descricao,
t.nome AS tipo,
pr.nome AS prioridade,
s.nome AS status,
d.projeto_id AS projetoId,
d.responsavel_id AS responsavelId,
DATE_FORMAT(d.criada_em, '%Y-%m-%d') AS criadaEm,
DATE_FORMAT(d.atualizada_em, '%Y-%m-%d') AS atualizadaEm,
d.prazo_finalizacao AS prazoFinalizacao
FROM demanda d
JOIN tipo_demanda t ON t.id = d.tipo_id
JOIN prioridade pr ON pr.id = d.prioridade_id
JOIN status_demanda s ON s.id = d.status_id`;
export async function listarDemandas(): Promise<Demanda[]> {
const [linhas] = await pool.query<RowDataPacket[]>(`${SELECT_DEMANDA} ORDER BY d.id`);
return linhas as Demanda[];
}
export async function buscarDemandaPorId(id: number): Promise<Demanda | null> {
const [linhas] = await pool.query<RowDataPacket[]>(`${SELECT_DEMANDA} WHERE d.id = ?`, [id]);
return (linhas[0] as Demanda | undefined) ?? null;
}
async function buscarProjetosLiderados(usuarioId: number): Promise<number[]> {
const [linhas] = await pool.query<RowDataPacket[]>(
"SELECT projeto_id FROM projeto_usuario WHERE usuario_id = ? AND lider = 1",
[usuarioId]
);
return linhas.map((l) => l.projeto_id as number);
}
const SELECT_USUARIO = `
SELECT u.id, u.nome, u.email, u.senha_hash AS senhaHash, p.nome AS perfil
FROM usuario u
JOIN perfil p ON p.id = u.perfil_id`;

// Usado no login: devolve também o hash da senha para conferir com o bcrypt.
// Esse hash nunca pode sair na resposta da API.
export async function buscarUsuarioParaLogin(
email: string
): Promise<(Usuario & { senhaHash: string }) | null> {
const [linhas] = await pool.query<RowDataPacket[]>(
`${SELECT_USUARIO} WHERE u.email = ? AND u.ativo = 1`,
[email]
);
const linha = linhas[0];
if (!linha) return null;
return {
id: linha.id,
nome: linha.nome,
email: linha.email,
senhaHash: linha.senhaHash,
perfil: linha.perfil,
projetosLiderados: await buscarProjetosLiderados(linha.id),
};
}
export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
const [linhas] = await pool.query<RowDataPacket[]>(
`${SELECT_USUARIO} WHERE u.id = ? AND u.ativo = 1`,
[id]
);
const linha = linhas[0];

if (!linha) return null;
return {
id: linha.id,
nome: linha.nome,
email: linha.email,
perfil: linha.perfil,
projetosLiderados: await buscarProjetosLiderados(linha.id),
};
}
export async function buscarProjetoPorId(id: number): Promise<Projeto | null> {
  const [linhas] = await pool.query<RowDataPacket[]>(
    "SELECT id, nome FROM projeto WHERE id = ?",
    [id]
  );
  const linha = linhas[0];
  if (!linha) return null;
  const [vinculos] = await pool.query<RowDataPacket[]>(
    "SELECT usuario_id, lider FROM projeto_usuario WHERE projeto_id = ?",
    [id]
  );
  return {
    id: linha.id,
    nome: linha.nome,
    liderIds: vinculos.filter((v) => v.lider === 1).map((v) => v.usuario_id as number),
    membroIds: vinculos.filter((v) => v.lider === 0).map((v) => v.usuario_id as number),
  };
}

// Todos os projetos com líderes e membros (2 consultas, sem uma por projeto)
export async function listarProjetos(): Promise<Projeto[]> {
  const [linhas] = await pool.query<RowDataPacket[]>("SELECT id, nome FROM projeto ORDER BY id");
  const [vinculos] = await pool.query<RowDataPacket[]>(
    "SELECT projeto_id, usuario_id, lider FROM projeto_usuario"
  );
  return linhas.map((p) => ({
    id: p.id,
    nome: p.nome,
    liderIds: vinculos.filter((v) => v.projeto_id === p.id && v.lider === 1).map((v) => v.usuario_id as number),
    membroIds: vinculos.filter((v) => v.projeto_id === p.id && v.lider === 0).map((v) => v.usuario_id as number),
  }));
}

// Usuários ativos, sem senha (select de responsável e nomes nas listagens)
export async function listarUsuarios(): Promise<UsuarioResumo[]> {
  const [linhas] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nome, u.email, p.nome AS perfil
     FROM usuario u JOIN perfil p ON p.id = u.perfil_id
     WHERE u.ativo = 1 ORDER BY u.id`
  );
  return linhas as UsuarioResumo[];
}

// Comentários da demanda, do mais antigo para o mais novo, já com o autor.
// A data sai como "2026-10-11T14:30:00", que o new Date() do frontend entende.
export async function listarComentarios(demandaId: number): Promise<Comentario[]> {
  const [linhas] = await pool.query<RowDataPacket[]>(
    `SELECT c.usuario_id AS autorId, c.texto,
            DATE_FORMAT(c.criado_em, '%Y-%m-%dT%H:%i:%s') AS data,
            u.nome, u.email, p.nome AS perfil
     FROM comentario c
     JOIN usuario u ON u.id = c.usuario_id
     JOIN perfil p ON p.id = u.perfil_id
     WHERE c.demanda_id = ?
     ORDER BY c.criado_em, c.id`,
    [demandaId]
  );
  return linhas.map((l) => ({
    autorId: l.autorId,
    texto: l.texto,
    data: l.data,
    autor: { id: l.autorId, nome: l.nome, email: l.email, perfil: l.perfil },
  }));
}

function formatarDataBr(iso: string | null): string | null {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Monta a frase que o frontend mostra para cada registro do histórico
function textoDoEvento(tipo: TipoAlteracao, autor: string, anterior: string | null, novo: string | null): string {
  switch (tipo) {
    case "Status":
      return `${autor} alterou o status da demanda de ${anterior} para ${novo}.`;
    case "Cancelamento":
      return `${autor} cancelou a demanda.`;
    case "Responsável":
      return `${autor} alterou o responsável de ${anterior ?? "nenhum"} para ${novo ?? "nenhum"}.`;
    case "Prioridade":
      return `${autor} alterou a prioridade de ${anterior} para ${novo}.`;
    case "Prazo":
      return `${autor} alterou o prazo de ${formatarDataBr(anterior) ?? "sem prazo"} para ${formatarDataBr(novo) ?? "sem prazo"}.`;
  }
}

// Histórico no formato { texto, data } que o frontend já usa. O primeiro
// evento ("Demanda criada por ...") vem da própria demanda (criada_em e
// criador_id), já que a tabela historico_alteracao não tem esse tipo.
export async function listarHistorico(demandaId: number): Promise<EventoHistorico[]> {
  const [criacao] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(d.criada_em, '%Y-%m-%dT%H:%i:%s') AS data, u.nome AS autor
     FROM demanda d JOIN usuario u ON u.id = d.criador_id
     WHERE d.id = ?`,
    [demandaId]
  );
  const [linhas] = await pool.query<RowDataPacket[]>(
    `SELECT ta.nome AS tipo, h.valor_anterior AS anterior, h.valor_novo AS novo,
            DATE_FORMAT(h.alterado_em, '%Y-%m-%dT%H:%i:%s') AS data, u.nome AS autor
     FROM historico_alteracao h
     JOIN tipo_alteracao ta ON ta.id = h.tipo_alteracao_id
     JOIN usuario u ON u.id = h.usuario_id
     WHERE h.demanda_id = ?
     ORDER BY h.alterado_em, h.id`,
    [demandaId]
  );
  const eventos: EventoHistorico[] = criacao[0]
    ? [{ texto: `Demanda criada por ${criacao[0].autor}.`, data: criacao[0].data }]
    : [];
  for (const l of linhas) {
    eventos.push({ texto: textoDoEvento(l.tipo, l.autor, l.anterior, l.novo), data: l.data });
  }
  return eventos;
}

