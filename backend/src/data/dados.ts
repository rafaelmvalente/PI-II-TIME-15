// Autor: Rafael Mendes Valente - RA: 25002875
// Data: 20/10/2026
// Descrição: Dados de teste em memória

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string; // nunca deve ser devolvida nas respostas da API
  perfil: "Administrador" | "Líder de Projeto" | "Membro da Equipe";
}

export interface Projeto {
  id: number;
  nome: string;
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

export const usuarios: Usuario[] = [
  { id: 1, nome: "Rafael Mendes Valente", email: "rafael.mv4@puccampinas.edu.br", senha: "123456", perfil: "Administrador" },
  { id: 2, nome: "Joao", email: "joao@puccampinas.edu.br", senha: "123456", perfil: "Líder de Projeto" },
  { id: 3, nome: "Caio", email: "caio@puccampinas.edu.br", senha: "123456", perfil: "Membro da Equipe" },
];

export const projetos: Projeto[] = [
  { id: 1, nome: "Projeto Alfa" },
  { id: 2, nome: "Projeto Beta" },
];

export const demandas: Demanda[] = [
  {
    id: 1,
    titulo: "Corrigir falha no login",
    descricao: "Erro ao autenticar com e-mail institucional",
    tipo: "Defeito",
    prioridade: "Crítica",
    status: "Em andamento",
    projetoId: 1,
    responsavelId: 1,
    criadaEm: "2026-10-10",
    atualizadaEm: "2026-10-12",
    prazoFinalizacao: "2026-10-22",
  },
  {
    id: 2,
    titulo: "Implementar tela de dashboard",
    descricao: "Indicadores resumidos das demandas",
    tipo: "Tarefa",
    prioridade: "Alta",
    status: "Aberta",
    projetoId: 1,
    responsavelId: null,
    criadaEm: "2026-10-08",
    atualizadaEm: "2026-10-08",
    prazoFinalizacao: "2026-10-25",
  },
  {
    id: 3,
    titulo: "Atualizar documentação da API",
    descricao: "Documentar rotas GET e POST",
    tipo: "Documentação",
    prioridade: "Média",
    status: "Concluída",
    projetoId: 2,
    responsavelId: 2,
    criadaEm: "2026-09-28",
    atualizadaEm: "2026-10-05",
    prazoFinalizacao: "2026-10-05",
  },
  {
    id: 4,
    titulo: "Ajustar layout responsivo",
    descricao: "Problemas em telas pequenas",
    tipo: "Melhoria",
    prioridade: "Baixa",
    status: "Cancelada",
    projetoId: 2,
    responsavelId: 3,
    criadaEm: "2026-09-20",
    atualizadaEm: "2026-09-30",
    prazoFinalizacao: null,
  },
];