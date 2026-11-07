// Autor: Rodrigo Gabi - RA: 25001714
// Data: 07/11/26
// Descrição: Tipos usados pelo backend (antes ficavam em data/dados.ts).
// O Usuario não carrega a senha; "projetosLiderados" são os ids dos projetos
// em que ele é líder (vem da coluna "lider" da tabela projeto_usuario).

export type Perfil = "Administrador" | "Líder de Projeto" | "Membro da Equipe";
export interface Usuario {
id: number;
nome: string;
email: string;
perfil: Perfil;
projetosLiderados: number[];
}
export interface Projeto {
id: number;
nome: string;
liderIds: number[];
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
