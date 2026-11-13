// Autor: Rafael Mendes Valente - RA: 25002875
// Data: 20/10/2026
// Descrição: Rota GET

import { Router } from "express";
import type { Request, Response } from "express";
import { listarDemandas, listarUsuarios } from "../db/consultas.js";
import { autenticar } from "../auth/autenticar.js";
import { podeVisualizar } from "../auth/permissoes.js";

const router = Router();

// Critério adotado para "em aberto": qualquer demanda que ainda não
// chegou ao fim do ciclo de vida (não está Concluída nem Cancelada).
function estaEmAberto(status: string): boolean {
  return status !== "Concluída" && status !== "Cancelada";
}

// Critério adotado para "próxima do prazo": demanda em aberto cujo
// prazo está a até 7 dias da data atual (inclui prazos já vencidos).
function estaProximaDoPrazo(prazoFinalizacao: string | null): boolean {
  if (!prazoFinalizacao) return false;

  const hoje = new Date();
  const prazo = new Date(prazoFinalizacao);
  const diasRestantes = Math.ceil(
    (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diasRestantes <= 7;
}

router.get("/dashboard", autenticar, async (req: Request, res: Response) => {
  const { projeto, dataInicio, dataFim, quantidadeItens, ordenarPor } = req.query;

  const [todasDemandas, usuarios] = await Promise.all([listarDemandas(), listarUsuarios()]);
  const nomesPorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const nomeResponsavel = (id: number | null) => (id ? nomesPorId.get(id) ?? null : null);

  const projetoIdFiltro = typeof projeto === "string" && projeto ? Number(projeto) : null;
  const dataInicioFiltro = typeof dataInicio === "string" && dataInicio ? new Date(dataInicio) : null;
  const dataFimFiltro = typeof dataFim === "string" && dataFim ? new Date(dataFim) : null;
  const limite = typeof quantidadeItens === "string" && quantidadeItens ? Number(quantidadeItens) : 5;
  const ordenacao = ordenarPor === "prazo" ? "prazo" : "prioridade";

  // Cada usuário vê os indicadores apenas das demandas que tem permissão de ver
  const demandas = todasDemandas
    .filter((d) => podeVisualizar(req.usuario!, d))
    .filter((d) => !projetoIdFiltro || d.projetoId === projetoIdFiltro)
    .filter((d) => !dataInicioFiltro || new Date(d.criadaEm) >= dataInicioFiltro)
    .filter((d) => !dataFimFiltro || new Date(d.criadaEm) <= dataFimFiltro);

  const total = demandas.length;

  const porStatus = {
    aberta: demandas.filter((d) => d.status === "Aberta").length,
    emAndamento: demandas.filter((d) => d.status === "Em andamento").length,
    emRevisao: demandas.filter((d) => d.status === "Em revisão").length,
    concluida: demandas.filter((d) => d.status === "Concluída").length,
    cancelada: demandas.filter((d) => d.status === "Cancelada").length,
  };

  const porPrioridade = {
    critica: demandas.filter((d) => d.prioridade === "Crítica").length,
    alta: demandas.filter((d) => d.prioridade === "Alta").length,
    media: demandas.filter((d) => d.prioridade === "Média").length,
    baixa: demandas.filter((d) => d.prioridade === "Baixa").length,
  };

  const porTipo = {
    tarefa: demandas.filter((d) => d.tipo === "Tarefa").length,
    defeito: demandas.filter((d) => d.tipo === "Defeito").length,
    melhoria: demandas.filter((d) => d.tipo === "Melhoria").length,
    documentacao: demandas.filter((d) => d.tipo === "Documentação").length,
  };

  const ordemPrioridade: Record<string, number> = { "Crítica": 0, "Alta": 1, "Média": 2, "Baixa": 3 };

  const criticasEmAberto = demandas
    .filter((d) => d.prioridade === "Crítica" && estaEmAberto(d.status))
    .sort((a, b) => {
      if (ordenacao === "prazo") {
        return (a.prazoFinalizacao ?? "9999-99-99").localeCompare(b.prazoFinalizacao ?? "9999-99-99");
      }
      return (ordemPrioridade[a.prioridade] ?? 99) - (ordemPrioridade[b.prioridade] ?? 99);
    })
    .slice(0, limite)
    .map((d) => ({ ...d, responsavelNome: nomeResponsavel(d.responsavelId) }));

  const proximasDoPrazo = demandas
    .filter((d) => estaEmAberto(d.status) && estaProximaDoPrazo(d.prazoFinalizacao))
    .sort((a, b) => (a.prazoFinalizacao ?? "9999-99-99").localeCompare(b.prazoFinalizacao ?? "9999-99-99"))
    .slice(0, limite)
    .map((d) => ({ ...d, responsavelNome: nomeResponsavel(d.responsavelId) }));

  return res.status(200).json({
    total,
    porStatus,
    porPrioridade,
    porTipo,
    criticasEmAberto,
    proximasDoPrazo,
  });
});

export default router;