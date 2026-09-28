// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Validações em JavaScript do formulário de cadastro/edição de demanda

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formDemanda');

  // Cada campo descreve sua própria regra de validação: qual evento dispara
  // a checagem e uma função que recebe o valor e retorna a mensagem de erro
  // (ou null se estiver tudo certo). Isso evita repetir a mesma estrutura de
  // validação/exibição de erro para cada campo separadamente.
  const regras = {
    titulo: {
      elemento: document.getElementById('titulo'),
      evento: 'blur',
      validar: (valor) => {
        if (!valor.trim()) return 'O título é obrigatório.';
        if (valor.trim().length < 5) return 'O título deve ter no mínimo 5 caracteres.';
        if (valor.trim().length > 120) return 'O título deve ter no máximo 120 caracteres.';
        return null;
      },
    },
    descricao: {
      elemento: document.getElementById('descricao'),
      evento: 'blur',
      validar: (valor) => {
        if (!valor.trim()) return 'A descrição é obrigatória.';
        if (valor.trim().length < 10) return 'A descrição deve ter no mínimo 10 caracteres.';
        return null;
      },
    },
    tipo: {
      elemento: document.getElementById('tipo'),
      evento: 'change',
      validar: (valor) => (valor === '' ? 'Selecione um tipo de demanda.' : null),
    },
    prioridade: {
      elemento: document.getElementById('prioridade'),
      evento: 'change',
      validar: (valor) => (valor === '' ? 'Selecione uma prioridade.' : null),
    },
    projeto: {
      elemento: document.getElementById('projeto'),
      evento: 'change',
      validar: (valor) => (valor === '' ? 'Selecione um projeto.' : null),
    },
    // O prazo é o único campo opcional (pode ser definido depois, conforme
    // o escopo do sistema). A validação de feriado por API fica para depois.
    prazo: {
      elemento: document.getElementById('prazo'),
      evento: 'change',
      validar: (valor) => {
        if (!valor) return null;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // 'T00:00:00' evita o bug comum do <input type="date"> "voltar um dia"
        // por causa de conversão de fuso horário.
        if (new Date(valor + 'T00:00:00') < hoje) {
          return 'O prazo não pode ser uma data no passado.';
        }
        return null;
      },
    },
  };

  // Cria a mensagem de erro logo abaixo do campo e marca ele como inválido.
  // Sempre limpa um erro anterior antes, pra não acumular mensagens.
  function mostrarErro(elemento, mensagem) {
    limparErro(elemento);
    const erro = document.createElement('span');
    erro.className = 'erro-validacao';
    erro.textContent = mensagem;
    elemento.insertAdjacentElement('afterend', erro);
    elemento.classList.add('campo-invalido');
  }

  function limparErro(elemento) {
    elemento.classList.remove('campo-invalido');
    const proximo = elemento.nextElementSibling;
    if (proximo?.classList.contains('erro-validacao')) proximo.remove();
  }

  // Valida um único campo pelo nome (chave do objeto "regras") e atualiza a
  // tela de acordo com o resultado. Retorna true/false pra uso no submit.
  function validarCampo(nome) {
    const { elemento, validar } = regras[nome];
    const mensagemErro = validar(elemento.value);
    mensagemErro ? mostrarErro(elemento, mensagemErro) : limparErro(elemento);
    return !mensagemErro;
  }

  // Roda a validação de todos os campos de uma vez — usado no envio do form.
  function validarTudo() {
    return Object.keys(regras)
      .map(validarCampo)
      .every(Boolean);
  }

  // Liga cada campo ao seu evento configurado (blur ou change), validando
  // em tempo real conforme o usuário interage com o formulário.
  Object.entries(regras).forEach(([nome, { elemento, evento }]) => {
    elemento.addEventListener(evento, () => validarCampo(nome));
  });

  // Impede o envio do formulário enquanto houver campos inválidos.
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (validarTudo()) {
      alert('Demanda validada com sucesso! (integração com backend será feita em etapa posterior)');
    } else {
      alert('Corrija os campos destacados antes de salvar a demanda.');
    }
  });

  // Limpa o formulário e remove todos os erros exibidos ao cancelar.
  document.getElementById('btnCancelar').addEventListener('click', () => {
    form.reset();
    document.querySelectorAll('.erro-validacao').forEach(el => el.remove());
    document.querySelectorAll('.campo-invalido').forEach(el => el.classList.remove('campo-invalido'));
  });
});