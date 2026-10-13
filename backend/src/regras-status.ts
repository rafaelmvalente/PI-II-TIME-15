// Autor: Rodrigo Gabi - RA: 25001714
// Data: 13/10/2026
// Descrição: Regras de transição de status das demandas, restritas por perfil de usuário

export type Perfil = 'administrador' | 'lider' | 'membro';
export type Status = 'aberta' | 'em_andamento' | 'em_revisao' | 'concluida' | 'cancelada';

// Transições permitidas para cada status (ciclo de vida da demanda)
// A chave é o status atual e o valor é a lista de status para onde ele pode ir
const transicoesDoCiclo: Record<Status, Status[]> = {
  aberta: ['em_andamento', 'cancelada'],
  em_andamento: ['em_revisao', 'cancelada'],
  em_revisao: ['concluida', 'em_andamento', 'cancelada'],
  concluida: [],   // demanda concluída não muda mais
  cancelada: [],   // demanda cancelada não muda mais
};

// Transições que o membro da equipe pode fazer
// Cada item é um par [status atual, novo status]
const transicoesDoMembro: [Status, Status][] = [
  ['aberta', 'em_andamento'],
  ['em_andamento', 'em_revisao'],
];

// Verifica se a mudança de status faz parte do ciclo de vida da demanda
function transicaoExiste(statusAtual: Status, novoStatus: Status): boolean {
  return transicoesDoCiclo[statusAtual].includes(novoStatus);
}

// Verifica se o perfil informado pode alterar o status da demanda
export function validarTransicaoDeStatus(
  perfil: Perfil,
  statusAtual: Status,
  novoStatus: Status
): { permitido: boolean; mensagem: string } {
    if (statusAtual === novoStatus) {
    return { permitido: false, mensagem: 'A demanda já está com esse status.' };
  }
  if (!transicaoExiste(statusAtual, novoStatus)) {
    return { permitido: false, mensagem: 'Essa mudança de status não é permitida.' };
  }
  if (perfil === 'administrador' || perfil === 'lider') {
    return { permitido: true, mensagem: 'Transição permitida.' };
  }
  if (perfil === 'membro') {
    for (const transicao of transicoesDoMembro) {
      if (transicao[0] === statusAtual && transicao[1] === novoStatus) {
        return { permitido: true, mensagem: 'Transição permitida.' };
      }
    }
    return {
      permitido: false,
      mensagem: 'O membro da equipe não tem permissão para fazer essa alteração de status.',
    };
  }

  // Perfil desconhecido
  return { permitido: false, mensagem: 'Perfil de usuário inválido.' };
}