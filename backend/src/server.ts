// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db/conexao.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import demandasRoutes from './routes/demandasRoutes.js';
import authRoutes from './routes/authRoutes.js';
import projetosRoutes from './routes/projetosRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';

const app = express();
const PORT = 3000;

// Libera o acesso para o frontend, que roda em outra origem (ex.: Live Server)
function cors(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

app.use(cors);
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', demandasRoutes);
app.use('/api', projetosRoutes);
app.use('/api', usuariosRoutes);

// Qualquer erro não tratado (ex.: banco fora do ar) vira uma resposta 500 em JSON
app.use((erro: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ mensagem: 'Erro interno do servidor' });
});

// Confere a conexão com o banco antes de aceitar requisições
try {
  await pool.query('SELECT 1');
  console.log('Conectado ao banco de dados MySQL');
} catch (erro) {
  console.error('Falha ao conectar no banco de dados:', erro);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});