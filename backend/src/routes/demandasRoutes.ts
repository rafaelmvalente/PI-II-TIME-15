// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rota GET para detalhar uma demanda específica
// Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)
// - Rota passa a exigir login e respeitar as permissões de cada perfil

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas, projetos, usuarios } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";
import { podeVisualizar } from "../auth/permissoes.js";

const router = Router();

router.get("/demandas/:id", autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  if (!podeVisualizar(req.usuario!, demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para ver esta demanda" });
  }

  const projeto = projetos.find((p) => p.id === demanda.projetoId) ?? null;

  const responsavel = demanda.responsavelId
    ? usuarios.find((u) => u.id === demanda.responsavelId) ?? null
    : null;

  return res.status(200).json({
    ...demanda,
    projeto,
    responsavel: responsavel
      ? {
          id: responsavel.id,
          nome: responsavel.nome,
          email: responsavel.email,
          perfil: responsavel.perfil,
        }
      : null,
  });
});

export default router;
