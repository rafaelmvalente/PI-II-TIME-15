// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Regras de permissão dos perfis Administrador, Líder de Projeto
// e Membro da Equipe. Este arquivo só responde "pode" ou "não pode";
// quem devolve o erro HTTP são as rotas.
//
// Toda permissão responde duas perguntas:
//   1. O QUE o perfil pode fazer?   -> tabela PERMISSOES
//   2. ONDE ele pode fazer?         -> função estaNoEscopo
//      - Administrador: em qualquer demanda
//      - Líder de Projeto: nas demandas dos projetos que lidera
//      - Membro da Equipe: nas demandas atribuídas a ele

import type { Usuario, Demanda, Perfil } from "../types/modelos.js";

type Status = Demanda["status"];

export type Acao =
  | "criarDemanda"
  | "editarDemanda"
  | "atribuirResponsavel"
  | "alterarPrioridade"
  | "alterarStatus"
  | "comentar";

// 1. O QUE cada perfil pode fazer (espelha a tabela do README)
const PERMISSOES: Record<Perfil, Acao[]> = {
  "Administrador": [
    "criarDemanda", "editarDemanda", "atribuirResponsavel",
    "alterarPrioridade", "alterarStatus", "comentar",
  ],
  "Líder de Projeto": [
    "criarDemanda", "editarDemanda", "atribuirResponsavel",
    "alterarPrioridade", "alterarStatus", "comentar",
  ],
  "Membro da Equipe": ["alterarStatus", "comentar"],
};

// O Membro da Equipe só pode fazer estas duas transições
const TRANSICOES_DO_MEMBRO: [Status, Status][] = [
  ["Aberta", "Em andamento"],
  ["Em andamento", "Em revisão"],
];

export function lideraProjeto(usuario: Usuario, projetoId: number): boolean {
  // projetosLiderados é carregado do banco uma vez, na autenticação
  return usuario.projetosLiderados.includes(projetoId);
}

// 2. ONDE o usuário pode agir
function estaNoEscopo(
  usuario: Usuario,
  alvo: { projetoId: number; responsavelId: number | null }
): boolean {
  switch (usuario.perfil) {
    case "Administrador":
      return true;
    case "Líder de Projeto":
      return lideraProjeto(usuario, alvo.projetoId);
    case "Membro da Equipe":
      return alvo.responsavelId === usuario.id;
  }
}

export function temPermissao(usuario: Usuario, acao: Acao): boolean {
  return PERMISSOES[usuario.perfil].includes(acao);
}

// Qualquer usuário também enxerga as demandas atribuídas a ele
// (ex.: um líder responsável por uma demanda de outro projeto).
export function podeVisualizar(
  usuario: Usuario,
  demanda: { projetoId: number; responsavelId: number | null }
): boolean {
  return estaNoEscopo(usuario, demanda) || demanda.responsavelId === usuario.id;
}

// Regra geral: o perfil tem a ação E a demanda/projeto está no escopo dele.
// Para criar demanda, passe { projetoId, responsavelId: null }.
export function podeExecutar(
  usuario: Usuario,
  acao: Acao,
  alvo: { projetoId: number; responsavelId: number | null }
): boolean {
  if (!temPermissao(usuario, acao)) return false;

  // Comentar é permitido em qualquer demanda que o usuário consegue ver
  if (acao === "comentar") return podeVisualizar(usuario, alvo);

  return estaNoEscopo(usuario, alvo);
}

export function podeAlterarStatus(
  usuario: Usuario,
  demanda: Demanda,
  novoStatus: Status
): boolean {
  if (!podeExecutar(usuario, "alterarStatus", demanda)) return false;

  if (usuario.perfil === "Membro da Equipe") {
    return TRANSICOES_DO_MEMBRO.some(
      ([de, para]) => de === demanda.status && para === novoStatus
    );
  }

  return true; // Administrador e Líder do projeto fazem todas as transições
}
