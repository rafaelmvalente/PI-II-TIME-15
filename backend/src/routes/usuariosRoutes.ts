// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Rota GET para listar os usuários (usada para preencher o
// select de responsável no frontend). Nunca devolve a senha.

import { Router } from "express";
import type { Request, Response } from "express";
import { usuarios } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";

const router = Router();

router.get("/usuarios", autenticar, (_req: Request, res: Response) => {
  return res.status(200).json(
    usuarios.map((u) => ({ id: u.id, nome: u.nome, perfil: u.perfil }))
  );
});

export default router;
