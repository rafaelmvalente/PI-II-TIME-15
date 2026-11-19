// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express do Sistema de Acompanhamento de Demandas
// (CORS, rotas da API, tratamento de erros e conexão com o banco).

import express from 'express'; // framework do servidor
import type { Request, Response, NextFunction } from 'express'; // tipos do Express
import { pool } from './db/conexao.js'; // conexão com o MySQL
import dashboardRoutes from './routes/dashboardRoutes.js'; // rotas do dashboard
import demandasRoutes from './routes/demandasRoutes.js'; // rotas de demandas
import authRoutes from './routes/authRoutes.js'; // rota de login
import projetosRoutes from './routes/projetosRoutes.js'; // rota de projetos
import usuariosRoutes from './routes/usuariosRoutes.js'; // rota de usuários

const app = express(); // cria a aplicação Express
const PORT = 3000; // porta onde a API fica disponível

// Libera o acesso para o frontend, que roda em outra origem (ex.: Live Server)
function cors(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*'); // aceita requisições de qualquer origem
  // Cabeçalhos permitidos
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Métodos permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  // Responde o "pré-voo" do navegador sem conteúdo
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next(); // segue para a rota
}

app.use(cors); // aplica o CORS em todas as requisições
app.use(express.json()); // converte o corpo JSON das requisições em req.body

// Rota de teste para ver se o servidor está no ar
app.get('/', (req: Request, res: Response) => {
  // Responde um texto simples
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

app.use('/api', authRoutes); // registra /api/login
app.use('/api', dashboardRoutes); // registra /api/dashboard
app.use('/api', demandasRoutes); // registra /api/demandas
app.use('/api', projetosRoutes); // registra /api/projetos
app.use('/api', usuariosRoutes); // registra /api/usuarios

// Transforma qualquer erro não tratado (ex.: banco fora do ar) em resposta 500
app.use((erro: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(erro); // mostra o erro no terminal
  res.status(500).json({ mensagem: 'Erro interno do servidor' }); // responde 500 em JSON
});

// Confere a conexão com o banco antes de aceitar requisições
try {
  await pool.query('SELECT 1'); // consulta simples só para testar a conexão
  console.log('Conectado ao banco de dados MySQL'); // avisa que o banco está ok
} catch (erro) {
  console.error('Falha ao conectar no banco de dados:', erro); // mostra o motivo da falha
  process.exit(1); // encerra o servidor, pois sem banco a API não funciona
}

// Começa a escutar as requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`); // avisa o endereço do servidor
});