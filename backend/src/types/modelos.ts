// Autor: Rodrigo Gabi - RA: 25001714
// Data: 07/11/26
// Descrição: Tipos usados pelo backend (antes ficavam em data/dados.ts).
// O Usuario não carrega a senha; "projetosLiderados" são os ids dos projetos
// em que ele é líder (vem da coluna "lider" da tabela projeto_usuario).
// Alterado por: Rodrigo Gabi - RA: 25001714 (12/11/2026)
// - Projeto ganha membroIds (vínculos com lider = 0), como na main
// - Tipos do histórico e dos comentários, que agora vêm do banco

export type Perfil = "Administrador" | "Líder de Projeto" | "Membro da Equipe";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  projetosLiderados: number[];
}

// Usuário sem os projetos liderados (listagens e "autor"/"responsável")
export type UsuarioResumo = Omit<Usuario, "projetosLiderados">;

export interface Projeto {
  id: number;
  nome: string;
  liderIds: number[];  // usuários que gerenciam o projeto (lider = 1)
  membroIds: number[]; // demais usuários vinculados ao projeto (lider = 0)
}

export interface Demanda {
  id: number;
  titulo: string;
  descricao: string;
  tipo: "Tarefa" | "Defeito" | "Melhoria" | "Documentação";
  prioridade: "Crítica" | "Alta" | "Média" | "Baixa";
  status: "Aberta" | "Em andamento" | "Em revisão" | "Concluída" | "Cancelada";
  projetoId: number;
  responsavelId: number | null;
  criadaEm: string;
  atualizadaEm: string;
  prazoFinalizacao: string | null;
}

export interface EventoHistorico {
  texto: string;
  data: string;
}

export interface Comentario {
  autorId: number;
  texto: string;
  data: string;
  autor: UsuarioResumo;
}

// Valores aceitos na tabela tipo_alteracao
export type TipoAlteracao = "Status" | "Responsável" | "Prioridade" | "Prazo" | "Cancelamento";
