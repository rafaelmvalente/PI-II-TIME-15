// Autor: Rodrigo Gabi - RA: 25001714
// Data: 07/11/26
// Descrição: Conexão com o banco MySQL. Cria um "pool" (conjunto de conexões
// reaproveitadas) que todo o backend importa para executar consultas.
// As credenciais ficam no arquivo .env (que não vai para o GitHub).

import "dotenv/config";
import { createPool } from "mysql2/promise";

// Lê uma variável do .env e avisa com clareza se ela estiver faltando
function variavel(nome: string): string {
const valor = process.env[nome];
if (valor === undefined) {
throw new Error(`A variável ${nome} não está definida no arquivo .env`);
}
return valor;
}
export const pool = createPool({
host: process.env.DB_HOST ?? "localhost",
port: Number(process.env.DB_PORT ?? 3306),
user: variavel("DB_USER"),
password: variavel("DB_PASSWORD"),
database: variavel("DB_NAME"),
waitForConnections: true,
connectionLimit: 10,
// Devolve DATE/DATETIME como texto ("2026-10-22") em vez de objeto Date,
// que é o formato que o frontend e as rotas já usam.
dateStrings: true,
});