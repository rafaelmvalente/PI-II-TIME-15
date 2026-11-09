// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});