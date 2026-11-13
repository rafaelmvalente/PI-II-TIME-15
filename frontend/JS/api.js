// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Funções compartilhadas de acesso à API (login/sessão e fetch
// autenticado). Carregado antes do script de cada página.

const API_BASE_URL = 'http://localhost:3000/api';

function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function obterToken() {
  return localStorage.getItem('token');
}

function obterUsuario() {
  const bruto = localStorage.getItem('usuario');
  return bruto ? JSON.parse(bruto) : null;
}

function encerrarSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

// Chamada no topo de toda página que exige login. Se não houver sessão,
// manda o usuário de volta pra tela de login.
function exigirLogin() {
  if (!obterToken()) {
    window.location.href = 'login.html';
  }
}

// Wrapper de fetch que já manda o token e trata sessão expirada/inválida.
async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(obterToken() ? { Authorization: `Bearer ${obterToken()}` } : {}),
      ...(opcoes.headers || {}),
    },
  });

  const dados = await resposta.json().catch(() => null);

  if (resposta.status === 401 && caminho !== '/login') {
    encerrarSessao();
    window.location.href = 'login.html';
    throw new Error('Sessão expirada');
  }

  if (!resposta.ok) {
    throw new Error(dados?.mensagem || 'Erro ao comunicar com o servidor.');
  }

  return dados;
}
