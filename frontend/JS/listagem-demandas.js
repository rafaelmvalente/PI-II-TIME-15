// Autor: Tiago Medeiros
// Data: 27/09/2026
// Descrição: Comportamento e validações em JavaScript da tela de listagem de
//            demandas — busca textual, filtros (status, prioridade, tipo,
//            responsável, projeto), ordenação dos resultados e validação do
//            campo de busca. A integração com o backend real (Node.js) será
//            feita em etapa posterior; por ora os dados exibidos são mock.

document.addEventListener('DOMContentLoaded', () => {

  // Dados de exemplo — serão substituídos pela chamada ao backend quando a
  // API de demandas estiver disponível.
  const demandas = [
    { titulo: 'Corrigir erro no login', tipo: 'defeito', prioridade: 'critica', status: 'em_andamento', projeto: 'projeto1', responsavel: 'Rafael', criadaEm: '2026-09-10', prazo: '2026-09-30' },
    { titulo: 'Criar tela de cadastro de demanda', tipo: 'tarefa', prioridade: 'alta', status: 'concluida', projeto: 'projeto1', responsavel: 'Vinicius', criadaEm: '2026-09-05', prazo: '2026-09-20' },
    { titulo: 'Melhorar responsividade do dashboard', tipo: 'melhoria', prioridade: 'media', status: 'aberta', projeto: 'projeto2', responsavel: 'Tiago', criadaEm: '2026-09-15', prazo: '2026-10-05' },
    { titulo: 'Atualizar documentação da API', tipo: 'documentacao', prioridade: 'baixa', status: 'em_revisao', projeto: 'projeto2', responsavel: 'Rodrigo', criadaEm: '2026-09-12', prazo: '2026-10-10' },
    { titulo: 'Adicionar validação de senha', tipo: 'tarefa', prioridade: 'alta', status: 'aberta', projeto: 'projeto1', responsavel: 'Mateus', criadaEm: '2026-09-20', prazo: '2026-10-01' },
  ];

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
    projeto: { projeto1: 'Projeto A', projeto2: 'Projeto B' },
  };

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

  // Preenche o filtro de responsáveis a partir dos dados existentes, em vez
  // de fixar nomes no HTML (evita repetição e mantém a lista sempre atual).
  function preencherResponsaveis() {
    const responsaveis = [...new Set(demandas.map((d) => d.responsavel))].sort();
    responsaveis.forEach((nome) => {
      const opcao = document.createElement('option');
      opcao.value = nome;
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
    const responsavel = filtroResponsavel.value;
    const projeto = filtroProjeto.value;
    const ordenarPor = filtroOrdenar.value;

    let resultado = demandas.filter((d) => {
      return (!termoBusca || d.titulo.toLowerCase().includes(termoBusca))
        && (!status || d.status === status)
        && (!prioridade || d.prioridade === prioridade)
        && (!tipo || d.tipo === tipo)
        && (!responsavel || d.responsavel === responsavel)
        && (!projeto || d.projeto === projeto);
    });

    if (ordenarPor) {
      const ordemPrioridade = { critica: 0, alta: 1, media: 2, baixa: 3 };
      resultado = [...resultado].sort((a, b) => {
        if (ordenarPor === 'prioridade') return ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade];
        if (ordenarPor === 'data_criacao') return new Date(a.criadaEm) - new Date(b.criadaEm);
        if (ordenarPor === 'prazo') return new Date(a.prazo) - new Date(b.prazo);
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
      linha.innerHTML = `
        <td>${escapar(d.titulo)}</td>
        <td>${rotulos.tipo[d.tipo]}</td>
        <td><span class="tag tag-${d.prioridade}">${rotulos.prioridade[d.prioridade]}</span></td>
        <td>${rotulos.status[d.status]}</td>
        <td>${rotulos.projeto[d.projeto] ?? escapar(d.projeto)}</td>
        <td>${escapar(d.responsavel)}</td>
        <td>${formatarData(d.criadaEm)}</td>
        <td>${formatarData(d.prazo)}</td>
      `;
      corpoTabela.appendChild(linha);
    });
  }

  preencherResponsaveis();

  campoBusca.addEventListener('input', () => {
    validarBusca(campoBusca.value);
    aplicarFiltros();
  });
  [filtroStatus, filtroPrioridade, filtroTipo, filtroResponsavel, filtroProjeto, filtroOrdenar]
    .forEach((elemento) => elemento.addEventListener('change', aplicarFiltros));

  aplicarFiltros();
});