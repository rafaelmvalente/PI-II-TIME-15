// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Middleware de autenticação: só deixa passar requisições com um
// token de sessão válido no cabeçalho "Authorization: Bearer <token>".

import type { Request, Response, NextFunction } from "express"; // tipos do Express
import { buscarUsuarioPorId } from "../db/consultas.js"; // busca o usuário no banco
import { buscarUsuarioIdPorToken } from "./sessoes.js"; // descobre o dono do token

// Confere o token da requisição e coloca o usuário logado em req.usuario
export async function autenticar(req: Request, res: Response, next: NextFunction)  {
  const cabecalho = req.headers.authorization; // lê o cabeçalho Authorization

  // Sem cabeçalho ou fora do formato "Bearer <token>"
  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    // Responde 401 (não logado)
    return res.status(401).json({ mensagem: "Faça login para continuar" });
  }

  const token = cabecalho.slice("Bearer ".length); // tira o "Bearer " e fica só com o token
  const usuarioId = buscarUsuarioIdPorToken(token); // procura de quem é o token
  // Busca os dados atuais do usuário no banco
  const usuario = usuarioId === undefined ? null : await buscarUsuarioPorId(usuarioId);

  if (!usuario) { // token desconhecido ou usuário não existe mais
    // Responde 401 (sessão inválida)
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada" });
  }

  req.usuario = usuario; // deixa o usuário logado disponível para a rota
  next(); // segue para a rota
}
