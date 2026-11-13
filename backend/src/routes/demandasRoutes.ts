// Autor: Mateus - RA: 25001369
// Data: 04/11/2026
// Descrição: Rotas de demandas (listar, detalhar, criar, editar, alterar
// status, cancelar e comentar)

import { Router } from "express";
import type { Request, Response } from "express";
import {
  listarDemandas,
  buscarDemandaPorId,
  buscarProjetoPorId,
  buscarUsuarioPorId,
  listarProjetos,
  listarUsuarios,
  listarComentarios,
  listarHistorico,
} from "../db/consultas.js";
import { criarDemanda, atualizarDemanda, adicionarComentario } from "../db/escritas.js";
import type { Alteracao, CamposDemanda } from "../db/escritas.js";
import type { Demanda, Projeto, UsuarioResumo } from "../types/modelos.js";
import { autenticar } from "../auth/autenticar.js";
import {
  podeVisualizar,
  podeExecutar,
  podeAlterarStatus,
  transicaoValida,
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

// Valida o prazo de finalização informado, bloqueando datas que caem em
// feriado nacional. Retorna a mensagem de erro, ou null quando o prazo é
// válido (ou não foi informado).
async function validarPrazoFinalizacao(prazoFinalizacao: unknown): Promise<string | null> {
  if (!prazoFinalizacao) return null;

  if (typeof prazoFinalizacao !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(prazoFinalizacao)) {
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

// Nunca devolve projetosLiderados/projetosVinculados, só os dados públicos
function resumirUsuario(usuario: UsuarioResumo): UsuarioResumo {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
}

// Detalhe da demanda no mesmo formato de antes: projeto, responsável,
// histórico ({ texto, data }) e comentários (com autor).
async function montarDemandaDetalhada(demanda: Demanda) {
  const [projeto, responsavel, historico, comentarios] = await Promise.all([
    buscarProjetoPorId(demanda.projetoId),
    demanda.responsavelId ? buscarUsuarioPorId(demanda.responsavelId) : Promise.resolve(null),
    listarHistorico(demanda.id),
    listarComentarios(demanda.id),
  ]);

  return {
    ...demanda,
    projeto,
    responsavel: responsavel ? resumirUsuario(responsavel) : null,
    historico,
    comentarios,
  };
}

// Relê a demanda depois de gravar, para devolver o estado salvo no banco
async function detalharPorId(id: number) {
  const demanda = await buscarDemandaPorId(id);
  if (!demanda) throw new Error(`Demanda ${id} não encontrada após gravar`);
  return montarDemandaDetalhada(demanda);
}

function montarDemandaResumida(
  demanda: Demanda,
  projetosPorId: Map<number, Projeto>,
  usuariosPorId: Map<number, UsuarioResumo>
) {
  const responsavel = demanda.responsavelId ? usuariosPorId.get(demanda.responsavelId) : undefined;

  return {
    id: demanda.id,
    titulo: demanda.titulo,
    tipo: demanda.tipo,
    prioridade: demanda.prioridade,
    status: demanda.status,
    projeto: projetosPorId.get(demanda.projetoId) ?? null,
    responsavel: responsavel ? resumirUsuario(responsavel) : null,
    criadaEm: demanda.criadaEm,
    prazoFinalizacao: demanda.prazoFinalizacao,
  };
}

// Busca a demanda do :id da URL; se não existir, já responde 404
async function carregarDemanda(req: Request, res: Response): Promise<Demanda | null> {
  const id = Number(req.params.id);
  const demanda = Number.isInteger(id) ? await buscarDemandaPorId(id) : null;
  if (!demanda) {
    res.status(404).json({ mensagem: "Demanda não encontrada" });
    return null;
  }
  return demanda;
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
router.get("/demandas", autenticar, async (req: Request, res: Response) => {
  const { status, prioridade, tipo, projetoId, responsavelId, busca, ordenarPor, direcao } = req.query;

  const statusFiltro = typeof status === "string" && status ? (STATUS_POR_SLUG[status] ?? status) : null;
  const prioridadeFiltro = typeof prioridade === "string" && prioridade ? (PRIORIDADE_POR_SLUG[prioridade] ?? prioridade) : null;
  const tipoFiltro = typeof tipo === "string" && tipo ? (TIPO_POR_SLUG[tipo] ?? tipo) : null;
  const projetoIdFiltro = typeof projetoId === "string" && projetoId ? Number(projetoId) : null;
  const responsavelIdFiltro = typeof responsavelId === "string" && responsavelId ? Number(responsavelId) : null;
  const buscaFiltro = typeof busca === "string" ? busca.trim().toLowerCase() : "";
  const comparador = typeof ordenarPor === "string" ? COMPARADORES[ordenarPor] : null;
  const sentidoInvertido = direcao === "desc";

  const [demandas, projetos, usuarios] = await Promise.all([listarDemandas(), listarProjetos(), listarUsuarios()]);
  const projetosPorId = new Map(projetos.map((p) => [p.id, p]));
  const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]));

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

  return res.status(200).json(resultado.map((d) => montarDemandaResumida(d, projetosPorId, usuariosPorId)));
});

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

  return res.status(200).json(await montarDemandaDetalhada(demanda));
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
  if (!Number.isInteger(projetoIdConvertido) || !(await buscarProjetoPorId(projetoIdConvertido))) {
    return res.status(400).json({ mensagem: "Projeto inválido." });
  }
  const responsavel = responsavelIdConvertido && Number.isInteger(responsavelIdConvertido)
    ? await buscarUsuarioPorId(responsavelIdConvertido)
    : null;
  if (responsavelIdConvertido && !responsavel) {
    return res.status(400).json({ mensagem: "Responsável inválido." });
  }

  const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
  if (erroPrazo) {
    return res.status(400).json({ mensagem: erroPrazo });
  }

  if (!podeExecutar(req.usuario!, "criarDemanda", { projetoId: projetoIdConvertido, responsavelId: null })) {
    return res.status(403).json({ mensagem: "Você não tem permissão para criar demandas neste projeto." });
  }

  const alteracoes: Alteracao[] = responsavel
    ? [{ tipo: "Responsável", anterior: null, novo: responsavel.nome }]
    : [];

  const id = await criarDemanda(
    {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      tipo: tipoConvertido,
      prioridade: prioridadeConvertida,
      projetoId: projetoIdConvertido,
      responsavelId: responsavelIdConvertido,
      prazoFinalizacao: prazoFinalizacao || null,
    },
    req.usuario!.id,
    alteracoes
  );

  return res.status(201).json(await detalharPorId(id));
});

// PUT /demandas/:id — edita os campos principais de uma demanda existente.
// Tudo é validado antes de gravar; só responsável, prioridade e prazo
// entram no histórico (limitação da tabela tipo_alteracao).
router.put("/demandas/:id", autenticar, async (req: Request, res: Response) => {
  const demanda = await carregarDemanda(req, res);
  if (!demanda) return;

  if (!podeExecutar(req.usuario!, "editarDemanda", demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para editar esta demanda." });
  }

  const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazoFinalizacao } = req.body ?? {};
  const campos: CamposDemanda = {};
  const alteracoes: Alteracao[] = [];

  if (titulo !== undefined) {
    if (typeof titulo !== "string" || titulo.trim().length < 5 || titulo.trim().length > 120) {
      return res.status(400).json({ mensagem: "O título deve ter entre 5 e 120 caracteres." });
    }
    campos.titulo = titulo.trim();
  }
  if (descricao !== undefined) {
    if (typeof descricao !== "string" || descricao.trim().length < 10) {
      return res.status(400).json({ mensagem: "A descrição deve ter no mínimo 10 caracteres." });
    }
    campos.descricao = descricao.trim();
  }
  if (tipo !== undefined) {
    const tipoConvertido = TIPO_POR_SLUG[tipo] ?? tipo;
    if (!Object.values(TIPO_POR_SLUG).includes(tipoConvertido)) {
      return res.status(400).json({ mensagem: "Tipo de demanda inválido." });
    }
    campos.tipo = tipoConvertido;
  }
  if (prioridade !== undefined) {
    const prioridadeConvertida = PRIORIDADE_POR_SLUG[prioridade] ?? prioridade;
    if (!Object.values(PRIORIDADE_POR_SLUG).includes(prioridadeConvertida)) {
      return res.status(400).json({ mensagem: "Prioridade inválida." });
    }
    campos.prioridade = prioridadeConvertida;
    if (prioridadeConvertida !== demanda.prioridade) {
      alteracoes.push({ tipo: "Prioridade", anterior: demanda.prioridade, novo: prioridadeConvertida });
    }
  }
  if (projetoId !== undefined) {
    const projetoIdConvertido = Number(projetoId);
    if (!Number.isInteger(projetoIdConvertido) || !(await buscarProjetoPorId(projetoIdConvertido))) {
      return res.status(400).json({ mensagem: "Projeto inválido." });
    }
    campos.projetoId = projetoIdConvertido;
  }
  if (responsavelId !== undefined) {
    const responsavelIdConvertido = responsavelId ? Number(responsavelId) : null;
    const novoResponsavel = responsavelIdConvertido && Number.isInteger(responsavelIdConvertido)
      ? await buscarUsuarioPorId(responsavelIdConvertido)
      : null;
    if (responsavelIdConvertido && !novoResponsavel) {
      return res.status(400).json({ mensagem: "Responsável inválido." });
    }
    if (!podeExecutar(req.usuario!, "atribuirResponsavel", demanda)) {
      return res.status(403).json({ mensagem: "Você não tem permissão para atribuir o responsável." });
    }
    campos.responsavelId = responsavelIdConvertido;
    if (responsavelIdConvertido !== demanda.responsavelId) {
      const anterior = demanda.responsavelId ? await buscarUsuarioPorId(demanda.responsavelId) : null;
      alteracoes.push({ tipo: "Responsável", anterior: anterior?.nome ?? null, novo: novoResponsavel?.nome ?? null });
    }
  }
  if (prazoFinalizacao !== undefined) {
    const erroPrazo = await validarPrazoFinalizacao(prazoFinalizacao);
    if (erroPrazo) {
      return res.status(400).json({ mensagem: erroPrazo });
    }
    const novoPrazo: string | null = prazoFinalizacao || null;
    campos.prazoFinalizacao = novoPrazo;
    if (novoPrazo !== demanda.prazoFinalizacao) {
      alteracoes.push({ tipo: "Prazo", anterior: demanda.prazoFinalizacao, novo: novoPrazo });
    }
  }

  await atualizarDemanda(demanda.id, req.usuario!.id, campos, alteracoes);

  return res.status(200).json(await detalharPorId(demanda.id));
});

// PATCH /demandas/:id/status — altera o status seguindo as regras de cada perfil.
router.patch("/demandas/:id/status", autenticar, async (req: Request, res: Response) => {
  const demanda = await carregarDemanda(req, res);
  if (!demanda) return;

  const { status } = req.body ?? {};
  const novoStatus = STATUS_POR_SLUG[status] ?? status;

  if (!Object.values(STATUS_POR_SLUG).includes(novoStatus)) {
    return res.status(400).json({ mensagem: "Status inválido." });
  }
  if (!transicaoValida(demanda.status, novoStatus)) {
    return res.status(409).json({
      mensagem: `Não é possível mudar de "${demanda.status}" para "${novoStatus}".`,
    });
  }
  if (!podeAlterarStatus(req.usuario!, demanda, novoStatus)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para fazer essa alteração de status." });
  }

  // Ir para "Cancelada" por aqui é um cancelamento, igual à rota /cancelar
  const alteracao: Alteracao = novoStatus === "Cancelada"
    ? { tipo: "Cancelamento", anterior: demanda.status, novo: novoStatus }
    : { tipo: "Status", anterior: demanda.status, novo: novoStatus };

  await atualizarDemanda(demanda.id, req.usuario!.id, { status: novoStatus }, [alteracao]);

  return res.status(200).json(await detalharPorId(demanda.id));
});

// POST /demandas/:id/cancelar — atalho para status = "Cancelada".
// Registra só "Cancelamento" no histórico.
router.post("/demandas/:id/cancelar", autenticar, async (req: Request, res: Response) => {
  const demanda = await carregarDemanda(req, res);
  if (!demanda) return;

  if (!transicaoValida(demanda.status, "Cancelada")) {
    return res.status(409).json({ mensagem: "Uma demanda concluída não pode ser cancelada." });
  }
  if (!podeAlterarStatus(req.usuario!, demanda, "Cancelada")) {
    return res.status(403).json({ mensagem: "Você não tem permissão para cancelar esta demanda." });
  }

  await atualizarDemanda(demanda.id, req.usuario!.id, { status: "Cancelada" }, [
    { tipo: "Cancelamento", anterior: demanda.status, novo: "Cancelada" },
  ]);

  return res.status(200).json(await detalharPorId(demanda.id));
});

// POST /demandas/:id/comentarios — adiciona um comentário na demanda.
router.post("/demandas/:id/comentarios", autenticar, async (req: Request, res: Response) => {
  const demanda = await carregarDemanda(req, res);
  if (!demanda) return;

  if (!temPermissao(req.usuario!, "comentar") || !podeVisualizar(req.usuario!, demanda)) {
    return res.status(403).json({ mensagem: "Você não tem permissão para comentar nesta demanda." });
  }

  const { texto } = req.body ?? {};
  if (typeof texto !== "string" || !texto.trim()) {
    return res.status(400).json({ mensagem: "O comentário não pode ficar vazio." });
  }

  await adicionarComentario(demanda.id, req.usuario!.id, texto.trim());

  return res.status(201).json(await detalharPorId(demanda.id));
});

export default router;
