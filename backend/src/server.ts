// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db/conexao.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import demandasRoutes from './routes/demandasRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', demandasRoutes);

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