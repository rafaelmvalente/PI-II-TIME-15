// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rota GET para detalhar uma demanda específica
// Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)
// - Rota passa a exigir login e respeitar as permissões de cada perfil

import { Router } from "express";
import type { Request, Response } from "express";
import { buscarDemandaPorId, buscarProjetoPorId, buscarUsuarioPorId } from "../db/consultas.js";
import { autenticar } from "../auth/autenticar.js";
import { podeVisualizar } from "../auth/permissoes.js";

const router = Router();

router.get("/demandas/:id", autenticar, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const demanda = await buscarDemandaPorId(id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  if (!podeVisualizar(req.usuario!, demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para ver esta demanda" });
  }

  const projeto = await buscarProjetoPorId(demanda.projetoId);

  const responsavel = demanda.responsavelId
    ? await buscarUsuarioPorId(demanda.responsavelId)
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
