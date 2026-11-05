// Autor: Mateus - RA: 25001369
// Data: 05/11/2026
// Descrição: Rota PATCH para cancelar uma demanda (sem exclusão física)

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas } from "../data/dados.js";

const router = Router();

router.patch("/demandas/:id/cancelar", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  if (demanda.status === "Cancelada") {
    return res.status(409).json({ mensagem: "Demanda já está cancelada" });
  }

  demanda.status = "Cancelada";
  demanda.atualizadaEm = new Date().toISOString().slice(0, 10);

  return res.status(200).json(demanda);
});

export default router;
