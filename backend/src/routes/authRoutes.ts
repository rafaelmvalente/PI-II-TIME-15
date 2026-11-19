// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Rota de login

import { Router } from "express"; // criador de rotas do Express
import type { Request, Response } from "express"; // tipos da requisição e da resposta
import bcrypt from "bcryptjs"; // compara a senha digitada com o hash salvo
import { buscarUsuarioParaLogin } from "../db/consultas.js"; // busca o usuário pelo e-mail
import { criarSessao } from "../auth/sessoes.js"; // gera o token de sessão

const router = Router(); // agrupa as rotas deste arquivo

// POST /api/login: confere e-mail e senha e devolve o token de sessão
router.post("/login", async (req: Request, res: Response) => {
  const { email, senha } = req.body ?? {}; // pega e-mail e senha do corpo (vazio se não vier corpo)

  // Campos ausentes, vazios ou inválidos
  if (typeof email !== "string" || typeof senha !== "string" || !email || !senha) {
    // Responde 400 (dados incompletos)
    return res.status(400).json({ mensagem: "Informe e-mail e senha" });
  }

  // Busca o usuário pelo e-mail, sem espaços nas pontas
  const usuario = await buscarUsuarioParaLogin(email.trim());

  // Mesma mensagem para e-mail ou senha errados: não revela quais e-mails existem
  // Usuário não existe ou senha não confere
  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash)))  {
    // Responde 401 (login recusado)
    return res.status(401).json({ mensagem: "E-mail ou senha inválidos" });
  }

  const token = criarSessao(usuario.id); // cria a sessão do usuário

  return res.status(200).json({ // responde 200 com o token e os dados públicos
    token, // token que o frontend envia nas próximas requisições
    usuario: { // dados do usuário para a tela (nunca o hash da senha)
      id: usuario.id, // id do usuário
      nome: usuario.nome, // nome exibido no menu
      email: usuario.email, // e-mail do usuário
      perfil: usuario.perfil, // perfil de acesso
    },
  });
});

export default router; // exporta as rotas para o server.ts
