// Autor: Rafael Mendes Valente - RA: 25002875
// Data: 20/10/2026
// Descrição: Rota GET

import { Router } from "express";
import type { Request, Response } from "express";
import { demandas } from "../data/dados.js";

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

router.get("/dashboard", (req: Request, res: Response) => {
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

  const criticasEmAberto = demandas.filter(
    (d) => d.prioridade === "Crítica" && estaEmAberto(d.status)
  );

  const proximasDoPrazo = demandas.filter(
    (d) => estaEmAberto(d.status) && estaProximaDoPrazo(d.prazoFinalizacao)
  );

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