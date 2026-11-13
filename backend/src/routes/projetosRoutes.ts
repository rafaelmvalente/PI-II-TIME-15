// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Rota GET para listar os projetos (usada para preencher
// selects de projeto no frontend)

import { Router } from "express";
import type { Request, Response } from "express";
import { projetos } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";

const router = Router();

router.get("/projetos", autenticar, (_req: Request, res: Response) => {
  return res.status(200).json(projetos.map((p) => ({ id: p.id, nome: p.nome })));
});

export default router;
