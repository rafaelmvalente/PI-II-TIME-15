// Autor: Vinicius Santucci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});