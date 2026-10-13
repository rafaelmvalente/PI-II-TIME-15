// Autor: Rodrigo Gabi - RA: 25001714
// Data: 13/10/2026
// Descrição: Validação e registro de comentários na tela de detalhes da demanda

document.addEventListener("DOMContentLoaded", function () {

    const lista = document.getElementById("listaComentarios");
    const campoTexto = document.getElementById("textoComentario");
    const erro = document.getElementById("erroComentario");
    const botao = document.getElementById("btnComentar");

    // Por enquanto o usuário logado é fixo (o login ainda não está ligado ao sistema)
    const usuarioLogado = "Usuário 1";

    function dataHoraAtual() {
        const agora = new Date();
        return agora.toLocaleString("pt-BR");
    }

    function validarComentario() {
        const texto = campoTexto.value.trim();
        if (texto === "") {
            erro.textContent = "O comentário não pode ficar vazio.";
            return false;
        }
        if (texto.length < 3) {
            erro.textContent = "O comentário deve ter no mínimo 3 caracteres.";
            return false;
        }
        if (texto.length > 500) {
            erro.textContent = "O comentário deve ter no máximo 500 caracteres.";
            return false;
        }
        erro.textContent = "";
        return true;
    }

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

    // Clique no botão "COMENTAR"
    botao.addEventListener("click", function () {
        if (validarComentario()) {
            adicionarComentarioNaTela(usuarioLogado, campoTexto.value.trim());

            // Limpa o campo para um novo comentário
            campoTexto.value = "";
        }
    });
});