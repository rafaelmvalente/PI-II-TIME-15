// Autor: Vinicius Santuci Virgolino - RA: 25000294
// Data: 05/11/2026
// Descrição: Informa ao TypeScript que o middleware "autenticar"
// adiciona o campo "usuario" na requisição (req).

import type { Usuario } from "../types/modelos.js"; // tipo do usuário do sistema

declare global { // altera um tipo global já existente
  namespace Express { // tipos do Express
    interface Request { // acrescenta campos ao tipo da requisição
      usuario?: Usuario; // usuário logado (só existe nas rotas que passam pelo "autenticar")
    }
  }
}

export {}; // faz o arquivo ser tratado como módulo (exigido pelo "declare global")
