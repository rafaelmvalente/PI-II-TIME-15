// Autor: Mateus - RA: 25001369
// Data: 06/11/2026
// Descrição: Integração com API externa (BrasilAPI) para validar feriados nacionais

interface FeriadoApi {
  date: string; // formato YYYY-MM-DD
  name: string;
  type: string;
}

const cachePorAno = new Map<number, FeriadoApi[]>();

async function buscarFeriadosDoAno(ano: number): Promise<FeriadoApi[]> {
  if (cachePorAno.has(ano)) {
    return cachePorAno.get(ano)!;
  }

  const resposta = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);

  if (!resposta.ok) {
    throw new Error(`Não foi possível consultar os feriados de ${ano}`);
  }

  const feriados = (await resposta.json()) as FeriadoApi[];
  cachePorAno.set(ano, feriados);
  return feriados;
}

// Verifica se a data (YYYY-MM-DD) informada é um feriado nacional.
// Lança erro caso a API externa de feriados esteja indisponível.
export async function ehFeriadoNacional(dataIso: string): Promise<boolean> {
  const ano = Number(dataIso.slice(0, 4));
  const feriados = await buscarFeriadosDoAno(ano);
  return feriados.some((feriado) => feriado.date === dataIso);
}
