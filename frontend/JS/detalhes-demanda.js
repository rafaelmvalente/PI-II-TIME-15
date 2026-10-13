// Autor: Rodrigo Gabi - RA: 25001714
// Data: 13/10/2026
// Descrição: Validação e registro de comentários e registro de alterações no histórico na tela de detalhes da demanda

document.addEventListener("DOMContentLoaded", function () {

    const lista = document.getElementById("listaComentarios");
    const campoTexto = document.getElementById("textoComentario");
    const erro = document.getElementById("erroComentario");
    const botao = document.getElementById("btnComentar");

    const listaHistorico = document.getElementById("listaHistorico");
    const statusDemanda = document.getElementById("statusDemanda");
    const botaoCancelar = document.getElementById("btnCancelar");

    // Por enquanto o usuário logado é fixo (o login ainda não está ligado ao sistema)
    const usuarioLogado = "Usuário 1";


    // Retorna a data e o horário atuais no formato do Brasil (dd/mm/aaaa hh:mm:ss)
    function dataHoraAtual() {

        const agora = new Date();

        return agora.toLocaleString("pt-BR");
    }


    // VALIDAÇÃO DO COMENTÁRIO

    function validarComentario() {

        const texto = campoTexto.value.trim();

        // 1 - Verifica se o campo está vazio
        if (texto === "") {
            erro.textContent = "O comentário não pode ficar vazio.";
            return false;
        }

        // 2 - Verifica quantidade mínima de caracteres
        if (texto.length < 3) {
            erro.textContent = "O comentário deve ter no mínimo 3 caracteres.";
            return false;
        }

        // 3 - Verifica quantidade máxima de caracteres
        if (texto.length > 500) {
            erro.textContent = "O comentário deve ter no máximo 500 caracteres.";
            return false;
        }

        erro.textContent = "";
        return true;
    }


    // Cria o comentário na tela, no topo da lista (do mais novo para o mais antigo)
    function adicionarComentarioNaTela(autor, texto) {

        const item = document.createElement("li");
        item.className = "comentario";

        const cabecalho = document.createElement("div");
        cabecalho.className = "comentario-cabecalho";

        const nomeAutor = document.createElement("span");
        nomeAutor.className = "comentario-autor";
        nomeAutor.textContent = autor;

        const data = document.createElement("span");
        data.className = "comentario-data";
        data.textContent = dataHoraAtual();

        const paragrafo = document.createElement("p");
        paragrafo.className = "comentario-texto";
        paragrafo.textContent = texto;

        cabecalho.appendChild(nomeAutor);
        cabecalho.appendChild(data);
        item.appendChild(cabecalho);
        item.appendChild(paragrafo);

        lista.insertBefore(item, lista.firstChild);
    }


    // CLIQUE NO BOTÃO "COMENTAR"

    botao.addEventListener("click", function () {

        // Só continua se o comentário for válido
        if (validarComentario()) {

            adicionarComentarioNaTela(usuarioLogado, campoTexto.value.trim());

            // Limpa o campo para um novo comentário
            campoTexto.value = "";
        }

    });

    // HISTÓRICO DE ALTERAÇÕES

    // Cria um registro no topo do histórico (do mais novo para o mais antigo)
    function adicionarNoHistorico(autor, textoAlteracao) {

        const item = document.createElement("li");

        const texto = document.createElement("span");
        texto.className = "historico-texto";
        texto.textContent = autor + " " + textoAlteracao;

        const data = document.createElement("span");
        data.className = "historico-data";
        data.textContent = dataHoraAtual();

        item.appendChild(texto);
        item.appendChild(data);

        listaHistorico.insertBefore(item, listaHistorico.firstChild);
    }


    // CLIQUE NO BOTÃO "CANCELAR DEMANDA"

    botaoCancelar.addEventListener("click", function () {

        const statusAtual = statusDemanda.textContent;

        // 1 - Demanda concluída ou já cancelada não pode ser cancelada
        if (statusAtual === "Concluída" || statusAtual === "Cancelada") {
            alert("Essa demanda não pode ser cancelada.");
            return;
        }

        // 2 - Pede a confirmação do usuário
        const confirmou = confirm("Deseja realmente cancelar esta demanda?");

        if (confirmou) {

            // Muda o status mostrado na tela
            statusDemanda.textContent = "Cancelada";
            statusDemanda.className = "tag status-cancelada";

            // Registra a alteração no histórico (ele nunca é apagado)
            adicionarNoHistorico(
                usuarioLogado,
                "cancelou a demanda. Status alterado de " + statusAtual + " para Cancelada."
            );
        }

    });


});