// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response } from 'express';
import dashboardRoutes from './routes/dashboardRoutes.js';
import demandasRoutes from './routes/demandasRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS: permite que as páginas do frontend (abertas direto do arquivo HTML)
// chamem esta API e enviem o token no cabeçalho Authorization
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

app.use('/api', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', demandasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});