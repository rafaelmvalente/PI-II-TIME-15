// Autor: Tiago Medeiros
// Data: 27/09/2026
// Descrição: Comportamento e validações em JavaScript da tela de listagem de
//            demandas — busca textual, filtros (status, prioridade, tipo,
//            responsável, projeto), ordenação dos resultados e validação do
//            campo de busca. Os dados vêm da API (GET /api/demandas).

document.addEventListener('DOMContentLoaded', async () => {
  exigirLogin();

  let demandas = [];

  const campoBusca = document.getElementById('campoBusca');
  const erroBusca = document.getElementById('erroBusca');
  const filtroStatus = document.getElementById('filtroStatus');
  const filtroPrioridade = document.getElementById('filtroPrioridade');
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroResponsavel = document.getElementById('filtroResponsavel');
  const filtroProjeto = document.getElementById('filtroProjeto');
  const filtroOrdenar = document.getElementById('filtroOrdenar');
  const corpoTabela = document.getElementById('corpoTabela');
  const mensagemVazio = document.getElementById('mensagemVazio');

  const rotulos = {
    tipo: { tarefa: 'Tarefa', defeito: 'Defeito', melhoria: 'Melhoria', documentacao: 'Documentação' },
    prioridade: { critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa' },
    status: { aberta: 'Aberta', em_andamento: 'Em andamento', em_revisao: 'Em revisão', concluida: 'Concluída', cancelada: 'Cancelada' },
  };

  const slugPorTipo = { Tarefa: 'tarefa', Defeito: 'defeito', Melhoria: 'melhoria', 'Documentação': 'documentacao' };
  const slugPorPrioridade = { 'Crítica': 'critica', Alta: 'alta', 'Média': 'media', Baixa: 'baixa' };
  const slugPorStatus = { Aberta: 'aberta', 'Em andamento': 'em_andamento', 'Em revisão': 'em_revisao', 'Concluída': 'concluida', Cancelada: 'cancelada' };

  // Evita que um título com caracteres especiais quebre o HTML gerado.
  function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  function formatarData(iso) {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Preenche os filtros de projeto e responsável a partir dos dados
  // retornados pela API, em vez de fixar opções no HTML.
  function preencherFiltrosDinamicos() {
    const projetos = new Map(demandas.map((d) => [d.projeto?.id, d.projeto?.nome]).filter(([id]) => id));
    [...projetos.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, nome]) => {
      const opcao = document.createElement('option');
      opcao.value = id;
      opcao.textContent = nome;
      filtroProjeto.appendChild(opcao);
    });

    const responsaveis = new Map(demandas.map((d) => [d.responsavel?.id, d.responsavel?.nome]).filter(([id]) => id));
    [...responsaveis.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, nome]) => {
      const opcao = document.createElement('option');
      opcao.value = id;
      opcao.textContent = nome;
      filtroResponsavel.appendChild(opcao);
    });
  }

  // Esta tela não tem envio de formulário (é uma busca em tempo real), então
  // a única validação que faz sentido aqui é orientar o usuário quando o
  // termo de busca é curto demais pra ser útil — sem bloquear a pesquisa.
  function validarBusca(valor) {
    const termo = valor.trim();
    erroBusca.textContent = termo.length === 1
      ? 'Digite ao menos 2 caracteres para uma busca mais precisa.'
      : '';
  }

  function aplicarFiltros() {
    const termoBusca = campoBusca.value.trim().toLowerCase();
    const status = filtroStatus.value;
    const prioridade = filtroPrioridade.value;
    const tipo = filtroTipo.value;
    const responsavelId = filtroResponsavel.value;
    const projetoId = filtroProjeto.value;
    const ordenarPor = filtroOrdenar.value;

    let resultado = demandas.filter((d) => {
      return (!termoBusca || d.titulo.toLowerCase().includes(termoBusca))
        && (!status || slugPorStatus[d.status] === status)
        && (!prioridade || slugPorPrioridade[d.prioridade] === prioridade)
        && (!tipo || slugPorTipo[d.tipo] === tipo)
        && (!responsavelId || String(d.responsavel?.id) === responsavelId)
        && (!projetoId || String(d.projeto?.id) === projetoId);
    });

    if (ordenarPor) {
      const ordemPrioridade = { 'Crítica': 0, Alta: 1, 'Média': 2, Baixa: 3 };
      resultado = [...resultado].sort((a, b) => {
        if (ordenarPor === 'prioridade') return ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
        if (ordenarPor === 'data_criacao') return new Date(a.criadaEm) - new Date(b.criadaEm);
        if (ordenarPor === 'prazo') return new Date(a.prazoFinalizacao ?? '9999-12-31') - new Date(b.prazoFinalizacao ?? '9999-12-31');
        if (ordenarPor === 'status') return a.status.localeCompare(b.status);
        return 0;
      });
    }

    renderizarTabela(resultado);
  }

  function renderizarTabela(lista) {
    corpoTabela.innerHTML = '';

    mensagemVazio.hidden = lista.length !== 0;
    if (lista.length === 0) return;

    lista.forEach((d) => {
      const linha = document.createElement('tr');
      linha.classList.add('linha-clicavel');
      linha.innerHTML = `
        <td>${escapar(d.titulo)}</td>
        <td>${d.tipo}</td>
        <td><span class="tag tag-${slugPorPrioridade[d.prioridade]}">${d.prioridade}</span></td>
        <td>${d.status}</td>
        <td>${escapar(d.projeto?.nome ?? '')}</td>
        <td>${escapar(d.responsavel?.nome ?? 'Sem responsável')}</td>
        <td>${formatarData(d.criadaEm)}</td>
        <td>${d.prazoFinalizacao ? formatarData(d.prazoFinalizacao) : '—'}</td>
      `;
      linha.addEventListener('click', () => {
        window.location.href = `detalhes-demanda.html?id=${d.id}`;
      });
      corpoTabela.appendChild(linha);
    });
  }

  try {
    demandas = await apiFetch('/demandas');
  } catch (erro) {
    mensagemVazio.textContent = erro.message;
    mensagemVazio.hidden = false;
    return;
  }

  preencherFiltrosDinamicos();

  campoBusca.addEventListener('input', () => {
    validarBusca(campoBusca.value);
    aplicarFiltros();
  });
  [filtroStatus, filtroPrioridade, filtroTipo, filtroResponsavel, filtroProjeto, filtroOrdenar]
    .forEach((elemento) => elemento.addEventListener('change', aplicarFiltros));

  aplicarFiltros();
});
