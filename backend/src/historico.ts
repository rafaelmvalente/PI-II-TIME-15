// Autor: Rodrigo Gabi - RA: 25001714
// Data: 13/10/2026
// Descrição: Rotas do histórico de alterações das demandas (listar e registrar)

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Formato de um registro do histórico
interface RegistroHistorico {
  id: number;
  demandaId: number;
  tipo: string;          
  valorAnterior: string; 
  valorNovo: string;     
  autor: string;         
  dataHora: string;      
}

const tiposPermitidos = ['status', 'responsavel', 'prioridade', 'prazo', 'cancelamento'];

// Lista que guarda o histórico na memória
// (quando o banco de dados for criado, ela será substituída por ele)
const historico: RegistroHistorico[] = [];
let proximoId = 1;

// Listar o histórico de uma demanda
router.get('/demandas/:id/historico', (req: Request, res: Response) => {
  const demandaId = Number(req.params.id);
  if (isNaN(demandaId)) {
    res.status(400).json({ mensagem: 'O id da demanda é inválido.' });
    return;
  }
  // Pega só os registros dessa demanda, do mais novo para o mais antigo
  const doDemanda: RegistroHistorico[] = [];

  for (let i = historico.length - 1; i >= 0; i--) {
    const registro = historico[i];

    if (registro && registro.demandaId === demandaId) {
      doDemanda.push(registro);
    }
  }

  res.status(200).json(doDemanda);
});

// Registrar uma alteração no histórico de uma demanda
router.post('/demandas/:id/historico', (req: Request, res: Response) => {
  const demandaId = Number(req.params.id);
  const { tipo, valorAnterior, valorNovo, autor } = req.body;
  if (isNaN(demandaId)) {
    res.status(400).json({ mensagem: 'O id da demanda é inválido.' });
    return;
  }
  let tipoValido = false;

  for (const permitido of tiposPermitidos) {
    if (permitido === tipo) {
      tipoValido = true;
    }
  }
  if (!tipoValido) {
    res.status(400).json({
      mensagem: 'O tipo deve ser: status, responsavel, prioridade, prazo ou cancelamento.',
    });
    return;
  }
  if (!valorAnterior || !valorNovo) {
    res.status(400).json({ mensagem: 'Informe o valor anterior e o valor novo.' });
    return;
  }
  if (valorAnterior === valorNovo) {
    res.status(400).json({ mensagem: 'O valor novo deve ser diferente do valor anterior.' });
    return;
  }
  if (!autor || autor.trim() === '') {
    res.status(400).json({ mensagem: 'O autor da alteração é obrigatório.' });
    return;
  }

  // Monta o registro com a data e o horário atuais
  const novoRegistro: RegistroHistorico = {
    id: proximoId,
    demandaId: demandaId,
    tipo: tipo,
    valorAnterior: valorAnterior,
    valorNovo: valorNovo,
    autor: autor.trim(),
    dataHora: new Date().toISOString(),
  };

  proximoId = proximoId + 1;
  historico.push(novoRegistro);

  res.status(201).json(novoRegistro);
});

// Não existem rotas para editar ou apagar o histórico:
// ele nunca é apagado, nem depois que a demanda é cancelada
export default router;