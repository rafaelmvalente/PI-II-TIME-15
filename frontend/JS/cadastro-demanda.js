// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Formulário de cadastro e edição de demanda: carrega projetos e
// usuários da API, preenche o formulário na edição, valida os campos e salva
// a demanda na API (POST para criar, PUT para editar)

// Executa quando o HTML da página termina de carregar
document.addEventListener('DOMContentLoaded', async () => {
  exigirLogin(); // sem login, volta para a tela de login

  const form = document.getElementById('formDemanda'); // formulário da demanda
  const selectProjeto = document.getElementById('projeto'); // select de projeto
  const selectResponsavel = document.getElementById('responsavel'); // select de responsável
  // Id da URL (?id=); null = nova demanda
  const idDemandaEditando = new URLSearchParams(window.location.search).get('id');
  let demandaOriginal = null; // demanda em edição, como veio da API (null = nova demanda)

  const mensagemApi = document.createElement('p'); // parágrafo para mensagens da API
  mensagemApi.className = 'mensagem-api'; // aplica o estilo da mensagem
  // Coloca a mensagem acima dos botões
  form.querySelector('.acoes-formulario').insertAdjacentElement('beforebegin', mensagemApi);

  // Carrega projetos e usuários da API e preenche os selects
  async function carregarListas() {
    const [projetos, usuarios] = await Promise.all([ // faz as duas buscas ao mesmo tempo
      apiFetch('/projetos'), // projetos que o usuário pode ver
      apiFetch('/usuarios'), // usuários que podem ser responsáveis
    ]);

    projetos.forEach((projeto) => { // para cada projeto...
      const opcao = document.createElement('option'); // cria uma opção
      opcao.value = projeto.id; // valor enviado: id do projeto
      opcao.textContent = projeto.nome; // texto exibido: nome do projeto
      selectProjeto.appendChild(opcao); // adiciona no select de projeto
    });

    usuarios.forEach((usuario) => { // para cada usuário...
      const opcao = document.createElement('option'); // cria uma opção
      opcao.value = usuario.id; // valor enviado: id do usuário
      opcao.textContent = usuario.nome; // texto exibido: nome do usuário
      selectResponsavel.appendChild(opcao); // adiciona no select de responsável
    });
  }

  // Preenche os campos do formulário com os dados da demanda
  function preencherFormulario(demanda) {
    document.getElementById('titulo').value = demanda.titulo; // preenche o título
    document.getElementById('descricao').value = demanda.descricao; // preenche a descrição
    selectProjeto.value = demanda.projetoId; // seleciona o projeto
    // Seleciona o responsável (ou "sem responsável")
    selectResponsavel.value = demanda.responsavelId ?? '';
    // Preenche o prazo (ou vazio)
    document.getElementById('prazo').value = demanda.prazoFinalizacao ?? '';

    const slugPorValorPt = { // converte o texto da API para o valor usado nos selects
      // Tipos
      tipo: { Tarefa: 'tarefa', Defeito: 'defeito', Melhoria: 'melhoria', 'Documentação': 'documentacao' },
      // Prioridades
      prioridade: { 'Crítica': 'critica', Alta: 'alta', 'Média': 'media', Baixa: 'baixa' },
    };
    document.getElementById('tipo').value = slugPorValorPt.tipo[demanda.tipo]; // seleciona o tipo
    // Seleciona a prioridade
    document.getElementById('prioridade').value = slugPorValorPt.prioridade[demanda.prioridade];
  }

  // No modo de edição, busca a demanda e preenche o formulário
  async function carregarDemandaParaEdicao() {
    if (!idDemandaEditando) return; // nova demanda: não há o que carregar

    demandaOriginal = await apiFetch(`/demandas/${idDemandaEditando}`); // busca a demanda na API
    preencherFormulario(demandaOriginal); // coloca os dados nos campos

    // Troca o título da tela
    document.querySelector('.cadastro-header h2').textContent = 'Editar Demanda';
    // Troca o texto do botão
    document.getElementById('btnSalvar').textContent = 'Salvar alterações';
  }

  try {
    await carregarListas(); // primeiro as opções dos selects...
    await carregarDemandaParaEdicao(); // ...depois a demanda, para conseguir marcar as opções
  } catch (erro) {
    mensagemApi.textContent = erro.message; // mostra o erro da API na tela
    mensagemApi.classList.add('mensagem-erro'); // deixa a mensagem em vermelho
  }

  // Sem permissão (ex.: página aberta direto pela URL): avisa e não deixa salvar
  const semPermissao = idDemandaEditando
    ? demandaOriginal && !demandaOriginal.permissoes?.editar // edição: o backend diz se pode
    : obterUsuario()?.perfil === 'Membro da Equipe'; // cadastro: Membro não cria demandas
  if (semPermissao) {
    mensagemApi.textContent = idDemandaEditando
      ? 'Você não tem permissão para editar esta demanda.'
      : 'Seu perfil não tem permissão para criar demandas.';
    mensagemApi.classList.add('mensagem-erro'); // deixa a mensagem em vermelho
  }
  // Na edição, sem a demanda carregada (erro já mostrado acima) também não há o que salvar
  if (semPermissao || (idDemandaEditando && !demandaOriginal)) {
    document.getElementById('btnSalvar').disabled = true; // impede o envio
  }

  // Regras de validação de cada campo: elemento, evento que dispara e função que valida
  const regras = {
    titulo: { // regras do título
      elemento: document.getElementById('titulo'), // campo de título
      evento: 'blur', // valida ao sair do campo
      validar: (valor) => {
        if (!valor.trim()) return 'O título é obrigatório.'; // vazio
        // Curto demais
        if (valor.trim().length < 5) return 'O título deve ter no mínimo 5 caracteres.';
        // Longo demais
        if (valor.trim().length > 120) return 'O título deve ter no máximo 120 caracteres.';
        return null; // válido
      },
    },
    descricao: { // regras da descrição
      elemento: document.getElementById('descricao'), // campo de descrição
      evento: 'blur', // valida ao sair do campo
      validar: (valor) => {
        if (!valor.trim()) return 'A descrição é obrigatória.'; // vazia
        // Curta demais
        if (valor.trim().length < 10) return 'A descrição deve ter no mínimo 10 caracteres.';
        return null; // válida
      },
    },
    tipo: { // regras do tipo
      elemento: document.getElementById('tipo'), // select de tipo
      evento: 'change', // valida ao trocar a opção
      validar: (valor) => (valor === '' ? 'Selecione um tipo de demanda.' : null), // obrigatório
    },
    prioridade: { // regras da prioridade
      elemento: document.getElementById('prioridade'), // select de prioridade
      evento: 'change', // valida ao trocar a opção
      validar: (valor) => (valor === '' ? 'Selecione uma prioridade.' : null), // obrigatória
    },
    projeto: { // regras do projeto
      elemento: document.getElementById('projeto'), // select de projeto
      evento: 'change', // valida ao trocar a opção
      validar: (valor) => (valor === '' ? 'Selecione um projeto.' : null), // obrigatório
    },
    prazo: { // regras do prazo (opcional; feriado é checado no backend)
      elemento: document.getElementById('prazo'), // campo de data do prazo
      evento: 'change', // valida ao trocar a data
      validar: (valor) => {
        if (!valor) return null; // sem prazo: válido
        // Na edição, manter o prazo que já estava salvo é permitido (mesmo vencido)
        if (valor === demandaOriginal?.prazoFinalizacao) return null;

        const hoje = new Date(); // data de hoje
        hoje.setHours(0, 0, 0, 0); // zera o horário para comparar só a data

        // Prazo antes de hoje ('T00:00:00' evita erro de fuso)
        if (new Date(valor + 'T00:00:00') < hoje) {
          return 'O prazo não pode ser uma data no passado.'; // data no passado
        }
        return null; // válido
      },
    },
  };

  // Mostra a mensagem de erro abaixo do campo e marca o campo como inválido
  function mostrarErro(elemento, mensagem) {
    limparErro(elemento); // remove um erro anterior, para não acumular
    const erro = document.createElement('span'); // cria o elemento da mensagem
    erro.className = 'erro-validacao'; // aplica o estilo de erro
    erro.textContent = mensagem; // coloca o texto do erro
    elemento.insertAdjacentElement('afterend', erro); // insere logo depois do campo
    elemento.classList.add('campo-invalido'); // destaca o campo em vermelho
  }

  // Remove a mensagem de erro e o destaque do campo
  function limparErro(elemento) {
    elemento.classList.remove('campo-invalido'); // tira o destaque vermelho
    const proximo = elemento.nextElementSibling; // elemento logo depois do campo
    // Se for a mensagem de erro, remove
    if (proximo?.classList.contains('erro-validacao')) proximo.remove();
  }

  // Valida um campo pelo nome e devolve true se estiver válido
  function validarCampo(nome) {
    const { elemento, validar } = regras[nome]; // pega o campo e a função de validação
    const mensagemErro = validar(elemento.value); // valida o valor atual
    // Mostra ou limpa o erro
    mensagemErro ? mostrarErro(elemento, mensagemErro) : limparErro(elemento);
    return !mensagemErro; // true se não houve erro
  }

  // Valida todos os campos e devolve true se todos estiverem válidos
  function validarTudo() {
    return Object.keys(regras) // nomes de todos os campos
      .map(validarCampo) // valida cada um (mostrando os erros)
      .every(Boolean); // true só se todos passaram
  }

  // Valida cada campo em tempo real, no evento definido nas regras
  Object.entries(regras).forEach(([nome, { elemento, evento }]) => {
    // Liga o evento à validação do campo
    elemento.addEventListener(evento, () => validarCampo(nome));
  });

  // Ao enviar: valida e salva a demanda na API
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // impede o envio padrão (recarregar a página)
    mensagemApi.textContent = ''; // limpa a mensagem anterior
    mensagemApi.classList.remove('mensagem-erro'); // tira o estilo de erro

    if (!validarTudo()) { // algum campo inválido
      // Avisa o usuário
      mensagemApi.textContent = 'Corrija os campos destacados antes de salvar a demanda.';
      mensagemApi.classList.add('mensagem-erro'); // deixa a mensagem em vermelho
      return; // não envia
    }

    const corpo = { // dados enviados para a API
      titulo: regras.titulo.elemento.value, // título
      descricao: regras.descricao.elemento.value, // descrição
      tipo: regras.tipo.elemento.value, // tipo
      prioridade: regras.prioridade.elemento.value, // prioridade
      projetoId: Number(regras.projeto.elemento.value), // id do projeto (número)
      // Id do responsável ou null
      responsavelId: selectResponsavel.value ? Number(selectResponsavel.value) : null,
      prazoFinalizacao: regras.prazo.elemento.value || null, // prazo ou null
    };

    try {
      if (idDemandaEditando) { // modo de edição
        // Atualiza a demanda
        await apiFetch(`/demandas/${idDemandaEditando}`, { method: 'PUT', body: JSON.stringify(corpo) });
      } else { // modo de cadastro
        // Cria a demanda
        await apiFetch('/demandas', { method: 'POST', body: JSON.stringify(corpo) });
      }
      window.location.href = 'listagem-demandas.html'; // deu certo: volta para a listagem
    } catch (erro) {
      mensagemApi.textContent = erro.message; // mostra o erro da API (ex.: prazo em feriado)
      mensagemApi.classList.add('mensagem-erro'); // deixa a mensagem em vermelho
    }
  });

  // Ao cancelar: desfaz as mudanças e limpa os erros
  document.getElementById('btnCancelar').addEventListener('click', () => {
    if (demandaOriginal) {
      preencherFormulario(demandaOriginal); // edição: volta aos dados salvos da demanda
    } else {
      form.reset(); // cadastro: volta os campos ao estado inicial
    }
    // Remove as mensagens de erro
    document.querySelectorAll('.erro-validacao').forEach(el => el.remove());
    // Tira os destaques vermelhos
    document.querySelectorAll('.campo-invalido').forEach(el => el.classList.remove('campo-invalido'));
  });
});