// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Middleware de autenticação ("segurança da porta").
//
// Lê o token do cabeçalho "Authorization: Bearer <token>".
// - Sem token ou token desconhecido -> 401 (não sei quem é você)
// - Token válido -> coloca o usuário em req.usuario e segue para a rota

import type { Request, Response, NextFunction } from "express";
import { buscarUsuarioPorId } from "../db/consultas.js";
import { buscarUsuarioIdPorToken } from "./sessoes.js";

export async function autenticar(req: Request, res: Response, next: NextFunction)  {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Faça login para continuar" });
  }

  const token = cabecalho.slice("Bearer ".length);
  const usuarioId = buscarUsuarioIdPorToken(token);
  const usuario = usuarioId === undefined ? null : await buscarUsuarioPorId(usuarioId);

  if (!usuario) {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada" });
  }

  req.usuario = usuario;
  next();
}
