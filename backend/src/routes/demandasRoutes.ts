// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rota GET para detalhar uma demanda específica

// Autores: Mateus - RA: 25001369 e Vinicius Santucci - RA: 25000294
// Data: 07/11/2026
// Descrição: Rota PATCH para transição de status de uma demanda (máquina de estados)

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas, projetos, usuarios } from "../data/dados.js";
import type { Demanda } from "../data/dados.js";

const router = Router();

type Status = Demanda["status"];

const transicoesPermitidas: Record<Status, Status[]> = {
  "Aberta": ["Em andamento", "Cancelada"],
  "Em andamento": ["Em revisão", "Cancelada"],
  "Em revisão": ["Concluída", "Em andamento", "Cancelada"],
  "Concluída": [],
  "Cancelada": [],
};

function isStatusValido(valor: unknown): valor is Status {
  return (
    typeof valor === "string" &&
    Object.prototype.hasOwnProperty.call(transicoesPermitidas, valor)
  );
}

router.get("/demandas/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
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

router.patch("/demandas/:id/status", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const { status: novoStatus } = req.body ?? {};

  if (!isStatusValido(novoStatus)) {
    return res.status(400).json({ mensagem: "Status informado é inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  const statusAtual = demanda.status;

  if (novoStatus === statusAtual) {
    return res.status(409).json({ mensagem: `Demanda já está com status "${statusAtual}"` });
  }

  const permitidas = transicoesPermitidas[statusAtual];

  if (!permitidas.includes(novoStatus)) {
    return res.status(409).json({
      mensagem: `Transição de "${statusAtual}" para "${novoStatus}" não é permitida`,
      transicoesPermitidas: permitidas,
    });
  }

  demanda.status = novoStatus;
  demanda.atualizadaEm = new Date().toISOString().slice(0, 10);

  return res.status(200).json(demanda);
});

export default router;
