// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Controle de sessões em memória (token -> id do usuário)
//
// Ao fazer login, o usuário recebe um token aleatório (o "crachá").
// Esse token fica guardado aqui e é enviado pelo frontend em toda requisição.
// Limitação conhecida: como fica em memória, reiniciar o servidor apaga as sessões.

import { randomUUID } from "node:crypto";

const sessoes = new Map<string, number>();

export function criarSessao(usuarioId: number): string {
  const token = randomUUID();
  sessoes.set(token, usuarioId);
  return token;
}

export function buscarUsuarioIdPorToken(token: string): number | undefined {
  return sessoes.get(token);
}

export function encerrarSessao(token: string): void {
  sessoes.delete(token);
}
