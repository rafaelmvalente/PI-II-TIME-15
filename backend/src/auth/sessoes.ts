// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Controle de sessões em memória (token -> id do usuário).
// Reiniciar o servidor apaga as sessões.

import { randomUUID } from "node:crypto"; // gerador de identificadores aleatórios (UUID)

const sessoes = new Map<string, number>(); // sessões ativas: token -> id do usuário

// Cria uma sessão para o usuário e devolve o token dela
export function criarSessao(usuarioId: number): string {
  const token = randomUUID(); // gera um token aleatório e difícil de adivinhar
  sessoes.set(token, usuarioId); // guarda o token associado ao usuário
  return token; // devolve o token para ser enviado ao frontend
}

// Devolve o id do usuário dono do token (ou undefined se não existir)
export function buscarUsuarioIdPorToken(token: string): number | undefined {
  return sessoes.get(token); // procura o token na tabela de sessões
}
