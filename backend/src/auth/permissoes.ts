// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Regras de permissão dos perfis Administrador, Líder de Projeto
// e Membro da Equipe. Só responde "pode" ou "não pode"; quem devolve o erro
// HTTP são as rotas.

import { listarProjetos } from "../db/consultas.js"; // busca os projetos no banco
import type { Usuario, Demanda, Perfil, Projeto } from "../types/modelos.js"; // tipos do sistema

type Status = Demanda["status"]; // status possíveis de uma demanda ("Aberta", "Em andamento", ...)

// Ações do sistema que dependem de permissão
export type Acao =
  | "criarDemanda" // criar uma demanda
  | "editarDemanda" // editar os campos de uma demanda
  | "atribuirResponsavel" // definir ou trocar o responsável
  | "alterarPrioridade" // mudar a prioridade
  | "alterarStatus" // mudar o status
  | "comentar"; // comentar na demanda

// O QUE cada perfil pode fazer
const PERMISSOES: Record<Perfil, Acao[]> = {
  "Administrador": [ // Administrador: todas as ações
    "criarDemanda", "editarDemanda", "atribuirResponsavel",
    "alterarPrioridade", "alterarStatus", "comentar",
  ],
  "Líder de Projeto": [ // Líder: todas as ações (nos projetos que lidera)
    "criarDemanda", "editarDemanda", "atribuirResponsavel",
    "alterarPrioridade", "alterarStatus", "comentar",
  ],
  "Membro da Equipe": ["alterarStatus", "comentar"], // Membro: só altera status e comenta
};

// Ciclo de vida: para quais status cada status pode ir (vale para todos os perfis)
const TRANSICOES_PERMITIDAS: Record<Status, Status[]> = {
  "Aberta": ["Em andamento", "Cancelada"], // Aberta só começa ou é cancelada
  "Em andamento": ["Em revisão", "Cancelada"], // Em andamento vai para revisão ou é cancelada
  // Em revisão conclui, volta ou é cancelada
  "Em revisão": ["Concluída", "Em andamento", "Cancelada"],
  "Concluída": [], // estado final
  "Cancelada": [], // estado final
};

// Únicas transições que o Membro da Equipe pode fazer
const TRANSICOES_DO_MEMBRO: [Status, Status][] = [
  ["Aberta", "Em andamento"], // começar a demanda
  ["Em andamento", "Em revisão"], // enviar para revisão
];

// Diz se o usuário é líder do projeto
export function lideraProjeto(usuario: Usuario, projetoId: number): boolean {
  // O projeto está na lista dos que ele lidera?
  return usuario.projetosLiderados.includes(projetoId);
}

// Diz se o usuário está vinculado ao projeto como membro
export function membroDoProjeto(usuario: Usuario, projetoId: number): boolean {
  // O projeto está na lista dos que ele participa?
  return usuario.projetosVinculados.includes(projetoId);
}

// Devolve os projetos que o usuário pode ver, de acordo com o perfil
export async function projetosVisiveis(usuario: Usuario): Promise<Projeto[]> {
  const projetos = await listarProjetos(); // busca todos os projetos no banco
  switch (usuario.perfil) { // decide pelo perfil do usuário
    case "Administrador":
      return projetos; // Administrador vê todos
    case "Líder de Projeto":
      return projetos.filter((p) => p.liderIds.includes(usuario.id)); // Líder vê os que lidera
    case "Membro da Equipe":
      return projetos.filter((p) => p.membroIds.includes(usuario.id)); // Membro vê os que participa
  }
}

// Diz ONDE o usuário pode agir: se a demanda está dentro do alcance dele
function estaNoEscopo(
  usuario: Usuario, // usuário logado
  alvo: { projetoId: number; responsavelId: number | null } // demanda (ou projeto) a verificar
): boolean {
  switch (usuario.perfil) { // decide pelo perfil do usuário
    case "Administrador":
      return true; // Administrador age em qualquer demanda
    case "Líder de Projeto":
      return lideraProjeto(usuario, alvo.projetoId); // Líder só nos projetos que lidera
    case "Membro da Equipe":
      return membroDoProjeto(usuario, alvo.projetoId); // Membro nos projetos em que participa
  }
}

// Diz se o perfil do usuário tem a ação (sem olhar projeto ou demanda)
export function temPermissao(usuario: Usuario, acao: Acao): boolean {
  return PERMISSOES[usuario.perfil].includes(acao); // a ação está na lista do perfil?
}

// Diz se o usuário pode ver a demanda
export function podeVisualizar(
  usuario: Usuario, // usuário logado
  demanda: { projetoId: number; responsavelId: number | null } // demanda a verificar
): boolean {
  // Está no escopo ou é o responsável
  return estaNoEscopo(usuario, demanda) || demanda.responsavelId === usuario.id;
}

// Diz se o usuário pode fazer a ação na demanda (perfil + escopo)
export function podeExecutar(
  usuario: Usuario, // usuário logado
  acao: Acao, // ação desejada
  // Demanda (para criar: { projetoId, responsavelId: null })
  alvo: { projetoId: number; responsavelId: number | null }
): boolean {
  if (!temPermissao(usuario, acao)) return false; // perfil não tem a ação: não pode

  // Comentar: basta conseguir ver a demanda
  if (acao === "comentar") return podeVisualizar(usuario, alvo);

  if (usuario.perfil === "Membro da Equipe") { // Membro vê o projeto todo, mas...
    return alvo.responsavelId === usuario.id; // ...só age nas demandas atribuídas a ele
  }

  return estaNoEscopo(usuario, alvo); // Administrador e Líder: depende do escopo
}

// Diz se a mudança de status existe no ciclo de vida (409 na rota se não existir)
export function transicaoValida(statusAtual: Status, novoStatus: Status): boolean {
  // O novo status é um destino permitido?
  return TRANSICOES_PERMITIDAS[statusAtual].includes(novoStatus);
}

// Diz se o usuário pode mudar o status da demanda para o novo status
export function podeAlterarStatus(
  usuario: Usuario, // usuário logado
  demanda: Demanda, // demanda a alterar
  novoStatus: Status // status desejado
): boolean {
  if (!podeExecutar(usuario, "alterarStatus", demanda)) return false; // sem permissão nesta demanda
  if (!transicaoValida(demanda.status, novoStatus)) return false; // transição fora do ciclo de vida

  if (usuario.perfil === "Membro da Equipe") { // Membro tem transições limitadas
    return TRANSICOES_DO_MEMBRO.some(
      // A transição é uma das duas do Membro?
      ([de, para]) => de === demanda.status && para === novoStatus
    );
  }

  return true; // Administrador e Líder do projeto fazem as demais transições previstas
}
