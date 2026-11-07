// Autor: Rodrigo Gabi - RA: 25001714
// Data: 07/11/26
// Descrição: Consultas ao banco usadas pelas rotas. Cada função devolve o mesmo
// formato de objeto que o antigo data/dados.ts, então as rotas quase não mudam.
// Todas usam "?" para os valores (consulta parametrizada), nunca texto concatenado.

import type { RowDataPacket } from "mysql2";
import { pool } from "./conexao.js";
import type { Demanda, Projeto, Usuario } from "../types/modelos.js";

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
if (!linhas[0]) return null;
const [lideres] = await pool.query<RowDataPacket[]>(
"SELECT usuario_id FROM projeto_usuario WHERE projeto_id = ? AND lider = 1",
[id]
);
return {
id: linhas[0].id,
nome: linhas[0].nome,
liderIds: lideres.map((l) => l.usuario_id as number),
};
}

