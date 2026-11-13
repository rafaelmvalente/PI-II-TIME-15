// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Conversão entre os valores usados no frontend (slugs em
// minúsculo, ex.: "em_andamento") e os valores em português gravados no
// banco de dados (ex.: "Em andamento").

import type { Demanda } from "../types/modelos.js";

export const STATUS_POR_SLUG: Record<string, Demanda["status"]> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  em_revisao: "Em revisão",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const PRIORIDADE_POR_SLUG: Record<string, Demanda["prioridade"]> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const TIPO_POR_SLUG: Record<string, Demanda["tipo"]> = {
  tarefa: "Tarefa",
  defeito: "Defeito",
  melhoria: "Melhoria",
  documentacao: "Documentação",
};

function inverter<T extends string>(mapa: Record<string, T>): Record<T, string> {
  const invertido = {} as Record<T, string>;
  for (const [slug, valor] of Object.entries(mapa)) {
    invertido[valor as T] = slug;
  }
  return invertido;
}

export const SLUG_POR_STATUS = inverter(STATUS_POR_SLUG);
export const SLUG_POR_PRIORIDADE = inverter(PRIORIDADE_POR_SLUG);
export const SLUG_POR_TIPO = inverter(TIPO_POR_SLUG);

// Ordem usada para ordenar por prioridade/status (não é alfabética:
// segue a urgência e o ciclo de vida da demanda).
export const ORDEM_PRIORIDADE: Record<Demanda["prioridade"], number> = {
  "Crítica": 0,
  "Alta": 1,
  "Média": 2,
  "Baixa": 3,
};

export const ORDEM_STATUS: Record<Demanda["status"], number> = {
  "Aberta": 0,
  "Em andamento": 1,
  "Em revisão": 2,
  "Concluída": 3,
  "Cancelada": 4,
};
