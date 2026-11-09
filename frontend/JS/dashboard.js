// Autor: Rafael Mendes Valente - RA: 25002875
// Data: 26/09/2026
// Descrição: Validações em JavaScript do formulário de filtro do Dashboard

document.addEventListener("DOMContentLoaded", function () {
  exigirLogin();

  var form = document.getElementById("filtroDashboardForm");

  var filtroProjeto = document.getElementById("filtroProjeto");

  var rotuloPorStatus = {
    aberta: "numeroAberta",
    emAndamento: "numeroEmAndamento",
    emRevisao: "numeroEmRevisao",
    concluida: "numeroConcluida",
    cancelada: "numeroCancelada",
  };
  var rotuloPorPrioridade = { critica: "numeroCritica", alta: "numeroAlta", media: "numeroMedia", baixa: "numeroBaixa" };
  var rotuloPorTipo = { tarefa: "numeroTarefa", defeito: "numeroDefeito", melhoria: "numeroMelhoria", documentacao: "numeroDocumentacao" };

  function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto || "";
    return div.innerHTML;
  }

  function formatarData(iso) {
    if (!iso) return "—";
    var partes = iso.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  function preencherTabela(idTbody, linhas, colunas) {
    var tbody = document.getElementById(idTbody);
    tbody.innerHTML = "";
    linhas.forEach(function (d) {
      var tr = document.createElement("tr");
      tr.innerHTML = colunas.map(function (coluna) { return "<td>" + coluna(d) + "</td>"; }).join("");
      tbody.appendChild(tr);
    });
  }

  async function carregarDashboard(filtros) {
    var parametros = new URLSearchParams();
    if (filtros && filtros.projeto) parametros.set("projeto", filtros.projeto);
    if (filtros && filtros.dataInicio) parametros.set("dataInicio", filtros.dataInicio);
    if (filtros && filtros.dataFim) parametros.set("dataFim", filtros.dataFim);
    if (filtros && filtros.quantidadeItens) parametros.set("quantidadeItens", filtros.quantidadeItens);
    if (filtros && filtros.ordenarPor) parametros.set("ordenarPor", filtros.ordenarPor);

    var dados = await apiFetch("/dashboard?" + parametros.toString());

    document.getElementById("numeroTotal").textContent = dados.total;
    Object.keys(rotuloPorStatus).forEach(function (chave) {
      document.getElementById(rotuloPorStatus[chave]).textContent = dados.porStatus[chave];
    });
    Object.keys(rotuloPorPrioridade).forEach(function (chave) {
      document.getElementById(rotuloPorPrioridade[chave]).textContent = dados.porPrioridade[chave];
    });
    Object.keys(rotuloPorTipo).forEach(function (chave) {
      document.getElementById(rotuloPorTipo[chave]).textContent = dados.porTipo[chave];
    });

    preencherTabela("corpoCriticasEmAberto", dados.criticasEmAberto, [
      function (d) { return escapar(d.titulo); },
      function (d) { return d.status; },
      function (d) { return d.responsavelNome ? escapar(d.responsavelNome) : "Sem responsável"; },
      function (d) { return formatarData(d.prazoFinalizacao); },
    ]);
    preencherTabela("corpoProximasDoPrazo", dados.proximasDoPrazo, [
      function (d) { return escapar(d.titulo); },
      function (d) { return d.prioridade; },
      function (d) { return d.status; },
      function (d) { return formatarData(d.prazoFinalizacao); },
    ]);
  }

  async function carregarProjetos() {
    var projetos = await apiFetch("/projetos");
    projetos.forEach(function (projeto) {
      var opcao = document.createElement("option");
      opcao.value = projeto.id;
      opcao.textContent = projeto.nome;
      filtroProjeto.appendChild(opcao);
    });
  }

  carregarProjetos().catch(function () {});
  carregarDashboard().catch(function (erro) { console.error(erro); });

  var campoDataInicio = document.getElementById("dataInicio");
  var campoDataFim = document.getElementById("dataFim");
  var campoQuantidade = document.getElementById("quantidadeItens");

  var erroDataInicio = document.getElementById("erroDataInicio");
  var erroDataFim = document.getElementById("erroDataFim");
  var erroQuantidade = document.getElementById("erroQuantidade");
  var erroOrdenacao = document.getElementById("erroOrdenacao");

  form.addEventListener("submit", function (evento) {
    evento.preventDefault(); // impede o recarregamento da página até validar

    // limpa erros de uma tentativa anterior
    [erroDataInicio, erroDataFim, erroQuantidade, erroOrdenacao].forEach(function (el) {
      el.textContent = "";
    });
    [campoDataInicio, campoDataFim, campoQuantidade].forEach(function (el) {
      el.classList.remove("campo-invalido");
    });

    var dataInicio = campoDataInicio.value;
    var dataFim = campoDataFim.value;
    var quantidade = campoQuantidade.value;
    var ordenacaoSelecionada = form.querySelector('input[name="ordenarPor"]:checked');

    var valido = true;

    // intervalo permitido (1 a 50)
    if (!quantidade) {
      erroQuantidade.textContent = "Informe a quantidade de itens a exibir.";
      campoQuantidade.classList.add("campo-invalido");
      valido = false;
    } else {
      var numero = Number(quantidade);
      if (isNaN(numero) || numero < 1 || numero > 50) {
        erroQuantidade.textContent = "Informe um valor numérico entre 1 e 50.";
        campoQuantidade.classList.add("campo-invalido");
        valido = false;
      }
    }

    // seleção obrigatória
    if (!ordenacaoSelecionada) {
      erroOrdenacao.textContent = "Selecione um critério de ordenação.";
      valido = false;
    }

    // período incompleto: só uma das datas foi preenchida
    if (dataInicio && !dataFim) {
      erroDataFim.textContent = "Informe também a data final.";
      campoDataFim.classList.add("campo-invalido");
      valido = false;
    }
    if (dataFim && !dataInicio) {
      erroDataInicio.textContent = "Informe também a data inicial.";
      campoDataInicio.classList.add("campo-invalido");
      valido = false;
    }

    // período invertido: data final antes da inicial
    if (dataInicio && dataFim) {
      var inicio = new Date(dataInicio);
      var fim = new Date(dataFim);
      if (fim < inicio) {
        erroDataFim.textContent = "A data final não pode ser anterior à data inicial.";
        campoDataFim.classList.add("campo-invalido");
        valido = false;
      }
    }

    if (!valido) {
      return; // bloqueia o envio enquanto houver dado inválido
    }

    carregarDashboard({
      projeto: document.getElementById("filtroProjeto").value,
      dataInicio: dataInicio,
      dataFim: dataFim,
      quantidadeItens: quantidade,
      ordenarPor: ordenacaoSelecionada.value,
    }).catch(function (erro) { console.error(erro); });
  });
});
