// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Informa ao TypeScript que o middleware "autenticar"
// adiciona os campos "usuario" e "token" na requisição (req).

import type { Usuario } from "../data/dados.js";

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
      token?: string;
    }
  }
}

export {};
