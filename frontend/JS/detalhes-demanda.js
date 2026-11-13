// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Carrega e exibe os detalhes de uma demanda (GET /api/demandas/:id)
// e permite editar, alterar status, cancelar e comentar.

document.addEventListener('DOMContentLoaded', async () => {
  exigirLogin();

  const idDemanda = new URLSearchParams(window.location.search).get('id');
  const mensagemApi = document.getElementById('mensagemApi');

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

  function formatarData(iso) {
    if (!iso) return '—';
    const data = new Date(iso);
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

    return demanda;
  }

  try {
    await carregarDemanda();
  } catch (erro) {
    mostrarErro(erro);
  }

  document.getElementById('btnEditar').addEventListener('click', () => {
    window.location.href = `cadastro-demanda.html?id=${idDemanda}`;
  });

  document.getElementById('btnAlterarStatus').addEventListener('click', async () => {
    const opcoes = ['aberta', 'em_andamento', 'em_revisao', 'concluida', 'cancelada'];
    const novoStatus = window.prompt(`Informe o novo status (${opcoes.join(', ')}):`);
    if (!novoStatus) return;

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

  document.getElementById('btnCancelar').addEventListener('click', async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta demanda?')) return;

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
