// Autor: Rodrigo Duarte Conceição Gabi - RA: 25001714
// Data: 21/09/2026
// Descrição: Validações em JavaScript do formulário de login

const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const senha = document.getElementById("password");


    // Mostra uma mensagem de erro abaixo do campo
    function mostrarErro(campo, mensagem) {

        limparErro(campo);

        const erro = document.createElement("span");
        erro.className = "erro-validacao";
        erro.textContent = mensagem;

        campo.insertAdjacentElement("afterend", erro);
    }


    // Remove a mensagem de erro do campo
    function limparErro(campo) {

        const proximoElemento = campo.nextElementSibling;

        if (
            proximoElemento &&
            proximoElemento.classList.contains("erro-validacao")
        ) {
            proximoElemento.remove();
        }
    }


    // VALIDAÇÃO DO E-MAIL

    function validarEmail() {

        const valorEmail = email.value.trim();

        // 1 - Verifica se o campo está vazio
        if (valorEmail === "") {
            mostrarErro(email, "O e-mail é obrigatório.");
            return false;
        }

        // 2 - Verifica o formato do e-mail
        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoEmail.test(valorEmail)) {
            mostrarErro(email, "Digite um e-mail válido.");
            return false;
        }
        limparErro(email);
        return true;
    }


    // VALIDAÇÃO DA SENHA

    function validarSenha() {

        const valorSenha = senha.value;

        // 1 - Verifica se o campo está vazio
        if (valorSenha === "") {
            mostrarErro(senha, "A senha é obrigatória.");
            return false;
        }


        // 2 - Verifica quantidade mínima de caracteres
        if (valorSenha.length < 6) {
            mostrarErro(
                senha,
                "A senha deve possuir no mínimo 6 caracteres."
            );

            return false;
        }


        // 3 - Verifica quantidade máxima de caracteres
        if (valorSenha.length > 30) {
            mostrarErro(
                senha,
                "A senha deve possuir no máximo 30 caracteres."
            );

            return false;
        }


        limparErro(senha);
        return true;
    }


    // ENVIO DO FORMULÁRIO

    formulario.addEventListener("submit", async function (event) {

        // Impede o envio do formulário
        event.preventDefault();

        const emailValido = validarEmail();
        const senhaValida = validarSenha();


        // Só continua se os dois campos forem válidos
        if (!emailValido || !senhaValida) {
            return;
        }


        // LOGIN NA API
        // Alterado por: Vinicius Santuci Virgolino - RA: 25000294 (05/11/2026)

        try {
            const resposta = await fetch(API_URL + "/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value.trim(),
                    senha: senha.value
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                mostrarErro(senha, dados.mensagem);
                return;
            }

            // Guarda o token ("crachá") e os dados do usuário para as próximas telas
            localStorage.setItem("token", dados.token);
            localStorage.setItem("usuario", JSON.stringify(dados.usuario));

            window.location.href = "dashboard.html";

        } catch (erro) {
            mostrarErro(senha, "Não foi possível conectar ao servidor.");
        }

    });

});
