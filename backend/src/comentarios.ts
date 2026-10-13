// Autor: Rodrigo Gabi - RA: 25001714
// Data: 13/10/2026
// Descrição: Rotas de comentários das demandas (listar e registrar)

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Formato de um comentário
interface Comentario {
  id: number;
  demandaId: number;
  autor: string;
  texto: string;
  dataHora: string; 
}

// Lista que guarda os comentários na memória
// (quando o banco de dados for criado, ela será substituída por ele)
const comentarios: Comentario[] = [];
let proximoId = 1;


// Listar os comentários de uma demanda
router.get('/demandas/:id/comentarios', (req: Request, res: Response) => {
  const demandaId = Number(req.params.id);

  // O id da demanda precisa ser um número
  if (isNaN(demandaId)) {
    res.status(400).json({ mensagem: 'O id da demanda é inválido.' });
    return;
  }

  // Pega só os comentários dessa demanda
  const doDemanda = comentarios.filter((c) => c.demandaId === demandaId);

  res.status(200).json(doDemanda);
});


// Registrar um comentário em uma demanda
router.post('/demandas/:id/comentarios', (req: Request, res: Response) => {
  const demandaId = Number(req.params.id);
  const { autor, texto } = req.body;

  if (isNaN(demandaId)) {
    res.status(400).json({ mensagem: 'O id da demanda é inválido.' });
    return;
  }
  if (!autor || typeof autor !== 'string' || autor.trim() === '') {
    res.status(400).json({ mensagem: 'O autor do comentário é obrigatório.' });
    return;
  }
  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    res.status(400).json({ mensagem: 'O comentário não pode ficar vazio.' });
    return;
  }
  if (texto.trim().length < 3) {
    res.status(400).json({ mensagem: 'O comentário deve ter no mínimo 3 caracteres.' });
    return;
  }
  if (texto.trim().length > 500) {
    res.status(400).json({ mensagem: 'O comentário deve ter no máximo 500 caracteres.' });
    return;
  }

  // Monta o comentário com a data e o horário atuais
  const novoComentario: Comentario = {
    id: proximoId,
    demandaId: demandaId,
    autor: autor.trim(),
    texto: texto.trim(),
    dataHora: new Date().toISOString(),
  };

  proximoId = proximoId + 1;
  comentarios.push(novoComentario);

  res.status(201).json(novoComentario);
});

export default router;