// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rota GET para detalhar uma demanda específica
// Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)
// - Rotas passam a exigir login e respeitar as permissões de cada perfil
// - Nova rota PATCH para alterar o status de uma demanda

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas, projetos, usuarios } from "../data/dados.js";
import type { Demanda } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";
import { podeVisualizar, podeAlterarStatus, transicaoValida } from "../auth/permissoes.js";

const router = Router();

const STATUS_EXISTENTES: Demanda["status"][] = [
  "Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada",
];

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

// Corpo esperado: { "status": "Em andamento" }
router.patch("/demandas/:id/status", autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const novoStatus = req.body?.status;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  if (!STATUS_EXISTENTES.includes(novoStatus)) {
    return res.status(400).json({ mensagem: "Status inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  // 1ª checagem: a transição existe no ciclo de vida? (vale para todos)
  if (!transicaoValida(demanda.status, novoStatus)) {
    return res.status(400).json({
      mensagem: `Não é possível mudar de "${demanda.status}" para "${novoStatus}"`,
    });
  }

  // 2ª checagem: o perfil do usuário permite esta transição?
  if (!podeAlterarStatus(req.usuario!, demanda, novoStatus)) {
    return res.status(403).json({ mensagem: "Seu perfil não permite esta alteração de status" });
  }

  demanda.status = novoStatus;
  demanda.atualizadaEm = new Date().toISOString().slice(0, 10);

  return res.status(200).json(demanda);
});

export default router;
