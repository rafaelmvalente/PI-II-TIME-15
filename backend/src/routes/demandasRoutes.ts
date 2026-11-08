// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rota GET para detalhar uma demanda específica
// Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)
// - Rota passa a exigir login e respeitar as permissões de cada perfil
// Alterado por: Mateus - RA: 25001369 (06/11/2026)
// - Adiciona rotas de cadastro e atualização de demanda, com validação de feriado nacional no prazo de finalização

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas, projetos, usuarios } from "../data/dados.js";
import type { Demanda } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";
import { podeVisualizar } from "../auth/permissoes.js";
import { ehFeriadoNacional } from "../feriados.js";

const router = Router();

function proximoId(): number {
  return demandas.reduce((maior, d) => Math.max(maior, d.id), 0) + 1;
}

// Valida o prazo de finalização informado, bloqueando datas que caem em feriado nacional.
// Retorna a mensagem de erro, ou null quando o prazo é válido (ou não foi informado).
async function validarPrazoFinalizacao(prazoFinalizacao: unknown): Promise<string | null> {
  if (!prazoFinalizacao) return null;

  if (typeof prazoFinalizacao !== "string") {
    return "O prazo de finalização deve ser uma data no formato YYYY-MM-DD";
  }

  let feriado: boolean;
  try {
    feriado = await ehFeriadoNacional(prazoFinalizacao);
  } catch {
    return "Não foi possível validar o prazo de finalização junto à API de feriados nacionais";
  }

  if (feriado) {
    return "O prazo de finalização não pode ser um feriado nacional";
  }

  return null;
}

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

router.post("/demandas", async (req: Request, res: Response) => {
  const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazoFinalizacao } =
    req.body as Partial<Demanda>;

  if (!titulo || !descricao || !tipo || !prioridade || !projetoId) {
    return res.status(400).json({
      mensagem: "titulo, descricao, tipo, prioridade e projetoId são obrigatórios",
    });
  }

  const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
  if (erroPrazo) {
    return res.status(400).json({ mensagem: erroPrazo });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const novaDemanda: Demanda = {
    id: proximoId(),
    titulo,
    descricao,
    tipo,
    prioridade,
    status: "Aberta",
    projetoId,
    responsavelId: responsavelId ?? null,
    criadaEm: hoje,
    atualizadaEm: hoje,
    prazoFinalizacao: prazoFinalizacao ?? null,
  };

  demandas.push(novaDemanda);

  return res.status(201).json(novaDemanda);
});

router.put("/demandas/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensagem: "Id de demanda inválido" });
  }

  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  const { prazoFinalizacao } = req.body as Partial<Demanda>;

  const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
  if (erroPrazo) {
    return res.status(400).json({ mensagem: erroPrazo });
  }

  const camposPermitidos: Array<keyof Demanda> = [
    "titulo",
    "descricao",
    "tipo",
    "prioridade",
    "status",
    "projetoId",
    "responsavelId",
    "prazoFinalizacao",
  ];

  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) {
      (demanda as any)[campo] = req.body[campo];
    }
  }

  demanda.atualizadaEm = new Date().toISOString().slice(0, 10);

  return res.status(200).json(demanda);
});

export default router;
