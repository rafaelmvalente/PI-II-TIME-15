// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Rota GET para listar os projetos (usada para preencher
// selects de projeto no frontend). Administrador vê todos os projetos,
// Líder vê os que lidera e Membro vê os que está vinculado.

import { Router } from "express";
import type { Request, Response } from "express";
import { autenticar } from "../auth/autenticar.js";
import { projetosVisiveis } from "../auth/permissoes.js";

const router = Router();

router.get("/projetos", autenticar, (req: Request, res: Response) => {
  const projetos = projetosVisiveis(req.usuario!);
  return res.status(200).json(projetos.map((p) => ({ id: p.id, nome: p.nome })));
});

export default router;
