// Autor: Rafael Mendes Valente - RA: 25002875
// Data: 26/09/2026
// Descrição: Validações em JavaScript do formulário de filtro do Dashboard

document.addEventListener("DOMContentLoaded", function () {

  var form = document.getElementById("filtroDashboardForm");

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

    // confirma que o filtro passou na validação
    console.log("Filtro válido:", {
      projeto: document.getElementById("filtroProjeto").value,
      dataInicio: dataInicio,
      dataFim: dataFim,
      quantidadeItens: quantidade,
      ordenarPor: ordenacaoSelecionada.value,
    });
  });
});
