// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Menu de navegação entre as telas autenticadas do sistema.
// Injetado no topo da página por quem chamar renderMenu(). Depende de
// api.js (obterUsuario/encerrarSessao) já ter sido carregado antes.

const PAGINAS_MENU = [
  { arquivo: 'dashboard.html', rotulo: 'Dashboard' },
  { arquivo: 'listagem-demandas.html', rotulo: 'Demandas' },
  { arquivo: 'cadastro-demanda.html', rotulo: 'Nova demanda' },
];

function renderMenu() {
  const paginaAtual = window.location.pathname.split('/').pop();
  const usuario = obterUsuario();

  const nav = document.createElement('nav');
  nav.className = 'menu-navegacao';

  const links = PAGINAS_MENU.map(({ arquivo, rotulo }) => {
    const ativo = arquivo === paginaAtual ? ' menu-link-ativo' : '';
    return `<a class="menu-link${ativo}" href="${arquivo}">${rotulo}</a>`;
  }).join('');

  nav.innerHTML = `
    <div class="menu-marca">Sistema de Acompanhamento de Demandas</div>
    <div class="menu-links">${links}</div>
    <div class="menu-usuario">
      <span class="menu-nome-usuario">${usuario ? usuario.nome : ''}</span>
      <button type="button" class="menu-sair" id="btnSairMenu">Sair</button>
    </div>
  `;

  document.body.prepend(nav);

  document.getElementById('btnSairMenu').addEventListener('click', () => {
    encerrarSessao();
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', renderMenu);
