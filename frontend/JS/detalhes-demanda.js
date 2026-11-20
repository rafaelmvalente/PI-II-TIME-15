// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Carrega e exibe os detalhes de uma demanda (GET /api/demandas/:id)
// e permite editar, alterar status, cancelar e comentar.

document.addEventListener('DOMContentLoaded', async () => {
  exigirLogin();

  const idDemanda = new URLSearchParams(window.location.search).get('id');
  const mensagemApi = document.getElementById('mensagemApi');
  const btnEditar = document.getElementById('btnEditar');
  const btnAlterarStatus = document.getElementById('btnAlterarStatus');
  const btnCancelar = document.getElementById('btnCancelar');
  let statusPermitidos = []; // status para onde o usuário pode levar a demanda

  // Valor que o backend aceita para cada status
  const slugPorStatus = {
    'Aberta': 'aberta',
    'Em andamento': 'em_andamento',
    'Em revisão': 'em_revisao',
    'Concluída': 'concluida',
    'Cancelada': 'cancelada',
  };

  // Mostra só os botões que o usuário logado pode usar nesta demanda.
  // Sem permissões (ex.: erro ao carregar), todos ficam escondidos.
  function atualizarBotoes(permissoes) {
    statusPermitidos = permissoes?.statusPermitidos ?? [];
    btnEditar.style.display = permissoes?.editar ? '' : 'none';
    btnAlterarStatus.style.display = statusPermitidos.length > 0 ? '' : 'none';
    btnCancelar.style.display = permissoes?.cancelar ? '' : 'none';
  }
  atualizarBotoes(null); // começa escondendo tudo até a demanda carregar

  const classePorStatus = {
    'Aberta': 'status-aberta',
    'Em andamento': 'status-andamento',
    'Em revisão': 'status-revisao',
    'Concluída': 'status-concluida',
    'Cancelada': 'status-cancelada',
  };
  const classePorPrioridade = {
    'Crítica': 'tag-critica',
    'Alta': 'tag-alta',
    'Média': 'tag-media',
    'Baixa': 'tag-baixa',
  };

  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  // A data vem como texto "AAAA-MM-DD". Ela é montada direto do texto porque
  // o new Date lê esse formato como meia-noite em UTC, o que no fuso do
  // Brasil mostraria o dia anterior.
  function formatarData(iso) {
    if (!iso) return '—';
    const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataHora(iso) {
    if (!iso) return '—';
    const data = new Date(iso);
    return data.toLocaleString('pt-BR');
  }

  function mostrarErro(erro) {
    mensagemApi.textContent = erro.message;
    mensagemApi.classList.add('mensagem-erro');
  }

  // Apaga o erro da ação anterior antes de tentar uma nova
  function limparErro() {
    mensagemApi.textContent = '';
    mensagemApi.classList.remove('mensagem-erro');
  }

  async function carregarDemanda() {
    if (!idDemanda) {
      mostrarErro(new Error('Nenhuma demanda informada na URL.'));
      return null;
    }

    const demanda = await apiFetch(`/demandas/${idDemanda}`);

    document.getElementById('codigoDemanda').textContent = `#${String(demanda.id).padStart(4, '0')}`;
    document.getElementById('tituloDemanda').textContent = demanda.titulo;
    document.getElementById('descricaoDemanda').textContent = demanda.descricao;

    const tagTipo = document.getElementById('tagTipo');
    tagTipo.textContent = demanda.tipo;

    const tagPrioridade = document.getElementById('tagPrioridade');
    tagPrioridade.textContent = demanda.prioridade;
    tagPrioridade.className = `tag ${classePorPrioridade[demanda.prioridade] ?? ''}`;

    const tagStatus = document.getElementById('tagStatus');
    tagStatus.textContent = demanda.status;
    tagStatus.className = `tag ${classePorStatus[demanda.status] ?? ''}`;

    document.getElementById('valorProjeto').textContent = demanda.projeto?.nome ?? '—';
    document.getElementById('valorResponsavel').textContent = demanda.responsavel?.nome ?? 'Sem responsável definido';
    document.getElementById('valorCriadaEm').textContent = formatarData(demanda.criadaEm);
    document.getElementById('valorAtualizadaEm').textContent = formatarData(demanda.atualizadaEm);
    document.getElementById('valorPrazo').textContent = formatarData(demanda.prazoFinalizacao);

    const listaHistorico = document.getElementById('listaHistorico');
    listaHistorico.innerHTML = '';
    [...demanda.historico].reverse().forEach((evento) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="historico-texto">${escapar(evento.texto)}</span>
        <span class="historico-data">${formatarData(evento.data)}</span>
      `;
      listaHistorico.appendChild(li);
    });

    const listaComentarios = document.getElementById('listaComentarios');
    listaComentarios.innerHTML = '';
    demanda.comentarios.forEach((comentario) => {
      const li = document.createElement('li');
      li.className = 'comentario';
      li.innerHTML = `
        <div class="comentario-cabecalho">
          <span class="comentario-autor">${escapar(comentario.autor?.nome ?? 'Usuário')}</span>
          <span class="comentario-data">${formatarDataHora(comentario.data)}</span>
        </div>
        <p class="comentario-texto">${escapar(comentario.texto)}</p>
      `;
      listaComentarios.appendChild(li);
    });

    atualizarBotoes(demanda.permissoes);

    return demanda;
  }

  try {
    await carregarDemanda();
  } catch (erro) {
    mostrarErro(erro);
  }

  btnEditar.addEventListener('click', () => {
    window.location.href = `cadastro-demanda.html?id=${idDemanda}`;
  });

  btnAlterarStatus.addEventListener('click', async () => {
    const opcoes = statusPermitidos.map((status) => slugPorStatus[status]); // só os permitidos
    const novoStatus = window.prompt(`Informe o novo status (${opcoes.join(', ')}):`);
    if (!novoStatus) return;

    limparErro();
    try {
      await apiFetch(`/demandas/${idDemanda}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus.trim() }),
      });
      await carregarDemanda();
    } catch (erro) {
      mostrarErro(erro);
    }
  });

  btnCancelar.addEventListener('click', async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta demanda?')) return;

    limparErro();
    try {
      await apiFetch(`/demandas/${idDemanda}/cancelar`, { method: 'POST' });
      await carregarDemanda();
    } catch (erro) {
      mostrarErro(erro);
    }
  });

  document.getElementById('formComentario').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const campoTexto = document.getElementById('textoComentario');
    if (!campoTexto.value.trim()) return;

    limparErro();
    try {
      await apiFetch(`/demandas/${idDemanda}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ texto: campoTexto.value }),
      });
      campoTexto.value = '';
      await carregarDemanda();
    } catch (erro) {
      mostrarErro(erro);
    }
  });
});
