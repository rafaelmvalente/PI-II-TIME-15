// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Rota de login

import { Router } from "express";
import type { Request, Response } from "express";
import { usuarios } from "../data/dados.js";
import { criarSessao } from "../auth/sessoes.js";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { email, senha } = req.body ?? {};

  if (typeof email !== "string" || typeof senha !== "string" || !email || !senha) {
    return res.status(400).json({ mensagem: "Informe e-mail e senha" });
  }

  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  // Mesma mensagem para e-mail ou senha errados: não revela quais e-mails existem
  if (!usuario || usuario.senha !== senha) {
    return res.status(401).json({ mensagem: "E-mail ou senha inválidos" });
  }

  const token = criarSessao(usuario.id);

  return res.status(200).json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  });
});

export default router;
