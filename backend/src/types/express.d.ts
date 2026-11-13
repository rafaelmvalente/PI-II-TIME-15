// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Informa ao TypeScript que o middleware "autenticar"
// adiciona o campo "usuario" na requisição (req).

import type { Usuario } from "../types/modelos.js";

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

export {};
