// Autor: Mateus - RA: 25001369
// Data: 09/11/2026
// Descrição: Rota GET para listar os usuários (usada para preencher o
// select de responsável no frontend). Nunca devolve a senha.
// Administrador vê todos os usuários; Líder e Membro só veem usuários que
// dividem projeto com eles (além de si mesmos).

import { Router } from "express";
import type { Request, Response } from "express";
import { usuarios } from "../data/dados.js";
import { autenticar } from "../auth/autenticar.js";
import { projetosVisiveis } from "../auth/permissoes.js";

const router = Router();

router.get("/usuarios", autenticar, async (req: Request, res: Response) => {
  const usuarioLogado = req.usuario!;

  let visiveis = usuarios;
  if (usuarioLogado.perfil !== "Administrador") {
    const projetos = await projetosVisiveis(usuarioLogado);
    const idsDoEscopo = new Set<number>([usuarioLogado.id]);
    for (const projeto of projetos) {
      projeto.liderIds.forEach((id) => idsDoEscopo.add(id));
      projeto.membroIds.forEach((id) => idsDoEscopo.add(id));
    }
    visiveis = usuarios.filter((u) => idsDoEscopo.has(u.id));
  }

  return res.status(200).json(
    visiveis.map((u) => ({ id: u.id, nome: u.nome, perfil: u.perfil }))
  );
});

export default router;
