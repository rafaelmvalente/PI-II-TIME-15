// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rotas de demandas (listar, detalhar, criar, editar, alterar
// status, cancelar e comentar)
// Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)
// - Rota passa a exigir login e respeitar as permissões de cada perfil
// Alterado por: Mateus - RA: 25001369 (09/11/2026)
// - Adicionadas as rotas de listagem, criação, edição, alteração de
//   status, cancelamento e comentários (integração com o frontend)
// Alterado por: Mateus - RA: 25001369 (09/11/2026)
// - POST /demandas e PUT /demandas/:id passam a validar o prazo de
//   finalização contra a API de feriados nacionais (item 2.2.5 do
//   Documento de Visão)

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas, projetos, usuarios } from "../data/dados.js";
import type { Demanda } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";
import {
  podeVisualizar,
  podeExecutar,
  podeAlterarStatus,
  temPermissao,
} from "../auth/permissoes.js";
import {
  STATUS_POR_SLUG,
  PRIORIDADE_POR_SLUG,
  TIPO_POR_SLUG,
  ORDEM_PRIORIDADE,
  ORDEM_STATUS,
} from "../data/mapeamentos.js";
import { ehFeriadoNacional } from "../feriados.js";

const router = Router();

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// Valida o prazo de finalização informado, bloqueando datas que caem em
// feriado nacional. Retorna a mensagem de erro, ou null quando o prazo é
// válido (ou não foi informado).
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

function montarResponsavel(responsavelId: number | null) {
  if (!responsavelId) return null;
  const responsavel = usuarios.find((u) => u.id === responsavelId);
  if (!responsavel) return null;
  return { id: responsavel.id, nome: responsavel.nome, email: responsavel.email, perfil: responsavel.perfil };
}

function montarDemandaDetalhada(demanda: Demanda) {
  const projeto = projetos.find((p) => p.id === demanda.projetoId) ?? null;

  return {
    ...demanda,
    projeto,
    responsavel: montarResponsavel(demanda.responsavelId),
    comentarios: demanda.comentarios.map((c) => ({
      ...c,
      autor: montarResponsavel(c.autorId),
    })),
  };
}

function montarDemandaResumida(demanda: Demanda) {
  const projeto = projetos.find((p) => p.id === demanda.projetoId) ?? null;
  const responsavel = montarResponsavel(demanda.responsavelId);

  return {
    id: demanda.id,
    titulo: demanda.titulo,
    tipo: demanda.tipo,
    prioridade: demanda.prioridade,
    status: demanda.status,
    projeto,
    responsavel,
    criadaEm: demanda.criadaEm,
    prazoFinalizacao: demanda.prazoFinalizacao,
  };
}

// Campos aceitos em ordenarPor (item 2.3 do Documento de Visão) e como
// comparar duas demandas por cada um deles.
const COMPARADORES: Record<string, (a: Demanda, b: Demanda) => number> = {
  prioridade: (a, b) => ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade],
  status: (a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status],
  criadaEm: (a, b) => a.criadaEm.localeCompare(b.criadaEm),
  // Demanda sem prazo vai para o fim da lista, em vez de confundir com uma data antiga.
  prazoFinalizacao: (a, b) => (a.prazoFinalizacao ?? "9999-99-99").localeCompare(b.prazoFinalizacao ?? "9999-99-99"),
};

// GET /demandas — lista as demandas que o usuário pode ver, com filtros,
// busca e ordenação opcionais por querystring. Os valores de
// status/prioridade/tipo podem vir tanto em português quanto no slug
// usado pelo frontend.
router.get("/demandas", autenticar, (req: Request, res: Response) => {
  const { status, prioridade, tipo, projetoId, responsavelId, busca, ordenarPor, direcao } = req.query;

  const statusFiltro = typeof status === "string" && status ? (STATUS_POR_SLUG[status] ?? status) : null;
  const prioridadeFiltro = typeof prioridade === "string" && prioridade ? (PRIORIDADE_POR_SLUG[prioridade] ?? prioridade) : null;
  const tipoFiltro = typeof tipo === "string" && tipo ? (TIPO_POR_SLUG[tipo] ?? tipo) : null;
  const projetoIdFiltro = typeof projetoId === "string" && projetoId ? Number(projetoId) : null;
  const responsavelIdFiltro = typeof responsavelId === "string" && responsavelId ? Number(responsavelId) : null;
  const buscaFiltro = typeof busca === "string" ? busca.trim().toLowerCase() : "";
  const comparador = typeof ordenarPor === "string" ? COMPARADORES[ordenarPor] : null;
  const sentidoInvertido = direcao === "desc";

  const resultado = demandas
    .filter((d) => podeVisualizar(req.usuario!, d))
    .filter((d) => !statusFiltro || d.status === statusFiltro)
    .filter((d) => !prioridadeFiltro || d.prioridade === prioridadeFiltro)
    .filter((d) => !tipoFiltro || d.tipo === tipoFiltro)
    .filter((d) => !projetoIdFiltro || d.projetoId === projetoIdFiltro)
    .filter((d) => !responsavelIdFiltro || d.responsavelId === responsavelIdFiltro)
    .filter((d) => !buscaFiltro || d.titulo.toLowerCase().includes(buscaFiltro) || d.descricao.toLowerCase().includes(buscaFiltro));

  if (comparador) {
    resultado.sort((a, b) => (sentidoInvertido ? comparador(b, a) : comparador(a, b)));
  }

  return res.status(200).json(resultado.map(montarDemandaResumida));
});

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

  return res.status(200).json(montarDemandaDetalhada(demanda));
});

// POST /demandas — cria uma nova demanda. Status inicial é sempre "Aberta".
router.post("/demandas", autenticar, async (req: Request, res: Response) => {
  const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazoFinalizacao } = req.body ?? {};

  if (typeof titulo !== "string" || titulo.trim().length < 5 || titulo.trim().length > 120) {
    return res.status(400).json({ mensagem: "O título deve ter entre 5 e 120 caracteres." });
  }
  if (typeof descricao !== "string" || descricao.trim().length < 10) {
    return res.status(400).json({ mensagem: "A descrição deve ter no mínimo 10 caracteres." });
  }

  const tipoConvertido = TIPO_POR_SLUG[tipo] ?? tipo;
  const prioridadeConvertida = PRIORIDADE_POR_SLUG[prioridade] ?? prioridade;
  const projetoIdConvertido = Number(projetoId);
  const responsavelIdConvertido = responsavelId ? Number(responsavelId) : null;

  if (!Object.values(TIPO_POR_SLUG).includes(tipoConvertido)) {
    return res.status(400).json({ mensagem: "Tipo de demanda inválido." });
  }
  if (!Object.values(PRIORIDADE_POR_SLUG).includes(prioridadeConvertida)) {
    return res.status(400).json({ mensagem: "Prioridade inválida." });
  }
  if (!projetos.some((p) => p.id === projetoIdConvertido)) {
    return res.status(400).json({ mensagem: "Projeto inválido." });
  }
  if (responsavelIdConvertido && !usuarios.some((u) => u.id === responsavelIdConvertido)) {
    return res.status(400).json({ mensagem: "Responsável inválido." });
  }

  const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
  if (erroPrazo) {
    return res.status(400).json({ mensagem: erroPrazo });
  }

  if (!podeExecutar(req.usuario!, "criarDemanda", { projetoId: projetoIdConvertido, responsavelId: null })) {
    return res.status(403).json({ mensagem: "Você não tem permissão para criar demandas neste projeto." });
  }

  const data = hoje();
  const novaDemanda: Demanda = {
    id: Math.max(0, ...demandas.map((d) => d.id)) + 1,
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    tipo: tipoConvertido,
    prioridade: prioridadeConvertida,
    status: "Aberta",
    projetoId: projetoIdConvertido,
    responsavelId: responsavelIdConvertido,
    criadaEm: data,
    atualizadaEm: data,
    prazoFinalizacao: prazoFinalizacao || null,
    historico: [{ texto: `Demanda criada por ${req.usuario!.nome}.`, data }],
    comentarios: [],
  };

  demandas.push(novaDemanda);

  return res.status(201).json(montarDemandaDetalhada(novaDemanda));
});

// PUT /demandas/:id — edita os campos principais de uma demanda existente.
router.put("/demandas/:id", autenticar, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }
  if (!podeExecutar(req.usuario!, "editarDemanda", demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para editar esta demanda." });
  }

  const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazoFinalizacao } = req.body ?? {};

  if (titulo !== undefined) {
    if (typeof titulo !== "string" || titulo.trim().length < 5 || titulo.trim().length > 120) {
      return res.status(400).json({ mensagem: "O título deve ter entre 5 e 120 caracteres." });
    }
    demanda.titulo = titulo.trim();
  }
  if (descricao !== undefined) {
    if (typeof descricao !== "string" || descricao.trim().length < 10) {
      return res.status(400).json({ mensagem: "A descrição deve ter no mínimo 10 caracteres." });
    }
    demanda.descricao = descricao.trim();
  }
  if (tipo !== undefined) {
    const tipoConvertido = TIPO_POR_SLUG[tipo] ?? tipo;
    if (!Object.values(TIPO_POR_SLUG).includes(tipoConvertido)) {
      return res.status(400).json({ mensagem: "Tipo de demanda inválido." });
    }
    demanda.tipo = tipoConvertido;
  }
  if (prioridade !== undefined) {
    const prioridadeConvertida = PRIORIDADE_POR_SLUG[prioridade] ?? prioridade;
    if (!Object.values(PRIORIDADE_POR_SLUG).includes(prioridadeConvertida)) {
      return res.status(400).json({ mensagem: "Prioridade inválida." });
    }
    demanda.prioridade = prioridadeConvertida;
  }
  if (projetoId !== undefined) {
    const projetoIdConvertido = Number(projetoId);
    if (!projetos.some((p) => p.id === projetoIdConvertido)) {
      return res.status(400).json({ mensagem: "Projeto inválido." });
    }
    demanda.projetoId = projetoIdConvertido;
  }
  if (responsavelId !== undefined) {
    const responsavelIdConvertido = responsavelId ? Number(responsavelId) : null;
    if (responsavelIdConvertido && !usuarios.some((u) => u.id === responsavelIdConvertido)) {
      return res.status(400).json({ mensagem: "Responsável inválido." });
    }
    if (!podeExecutar(req.usuario!, "atribuirResponsavel", demanda)) {
      return res.status(403).json({ mensagem: "Você não tem permissão para atribuir o responsável." });
    }
    demanda.responsavelId = responsavelIdConvertido;
  }
  if (prazoFinalizacao !== undefined) {
    const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
    if (erroPrazo) {
      return res.status(400).json({ mensagem: erroPrazo });
    }
    demanda.prazoFinalizacao = prazoFinalizacao || null;
  }

  demanda.atualizadaEm = hoje();
  demanda.historico.push({ texto: `${req.usuario!.nome} editou a demanda.`, data: demanda.atualizadaEm });

  return res.status(200).json(montarDemandaDetalhada(demanda));
});

// PATCH /demandas/:id/status — altera o status seguindo as regras de cada perfil.
router.patch("/demandas/:id/status", autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }

  const { status } = req.body ?? {};
  const novoStatus = STATUS_POR_SLUG[status] ?? status;

  if (!Object.values(STATUS_POR_SLUG).includes(novoStatus)) {
    return res.status(400).json({ mensagem: "Status inválido." });
  }
  if (!podeAlterarStatus(req.usuario!, demanda, novoStatus)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para fazer essa alteração de status." });
  }

  const statusAnterior = demanda.status;
  demanda.status = novoStatus;
  demanda.atualizadaEm = hoje();
  demanda.historico.push({
    texto: `${req.usuario!.nome} alterou o status da demanda de ${statusAnterior} para ${novoStatus}.`,
    data: demanda.atualizadaEm,
  });

  return res.status(200).json(montarDemandaDetalhada(demanda));
});

// POST /demandas/:id/cancelar — atalho para status = "Cancelada".
router.post("/demandas/:id/cancelar", autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }
  if (!podeAlterarStatus(req.usuario!, demanda, "Cancelada")) {
    return res.status(403).json({ mensagem: "Você não tem permissão para cancelar esta demanda." });
  }

  demanda.status = "Cancelada";
  demanda.atualizadaEm = hoje();
  demanda.historico.push({ texto: `${req.usuario!.nome} cancelou a demanda.`, data: demanda.atualizadaEm });

  return res.status(200).json(montarDemandaDetalhada(demanda));
});

// POST /demandas/:id/comentarios — adiciona um comentário na demanda.
router.post("/demandas/:id/comentarios", autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const demanda = demandas.find((d) => d.id === id);

  if (!demanda) {
    return res.status(404).json({ mensagem: "Demanda não encontrada" });
  }
  if (!temPermissao(req.usuario!, "comentar") || !podeVisualizar(req.usuario!, demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para comentar nesta demanda." });
  }

  const { texto } = req.body ?? {};
  if (typeof texto !== "string" || !texto.trim()) {
    return res.status(400).json({ mensagem: "O comentário não pode ficar vazio." });
  }

  demanda.comentarios.push({
    autorId: req.usuario!.id,
    texto: texto.trim(),
    data: new Date().toISOString(),
  });

  return res.status(201).json(montarDemandaDetalhada(demanda));
});

export default router;
