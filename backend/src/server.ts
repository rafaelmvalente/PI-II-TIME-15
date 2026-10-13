// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 21/09/2026
// Descrição: Servidor Express básico do Sistema de Acompanhamento de Demandas

import express from 'express';
import type { Request, Response } from 'express';
import { validarTransicaoDeStatus } from './regras-status.js';
import type { Perfil, Status } from './regras-status.js';
import comentariosRouter from './comentarios.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está rodando!');
});

// Rota que verifica se um perfil pode alterar o status de uma demanda
// Corpo esperado: { "perfil": "membro", "statusAtual": "aberta", "novoStatus": "em_andamento" }
app.post('/demandas/validar-status', (req: Request, res: Response) => {
  const { perfil, statusAtual, novoStatus } = req.body;

  // Verifica se todos os campos foram enviados
  if (!perfil || !statusAtual || !novoStatus) {
    res.status(400).json({ mensagem: 'Informe perfil, statusAtual e novoStatus.' });
    return;
  }

  const resultado = validarTransicaoDeStatus(
    perfil as Perfil,
    statusAtual as Status,
    novoStatus as Status
  );

  // 200 se permitido e 403 (proibido) se não for
  if (resultado.permitido) {
    res.status(200).json(resultado);
  } else {
    res.status(403).json(resultado);
  }
});

// Rotas de comentários das demandas
app.use(comentariosRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});