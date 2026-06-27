import type { Finance } from '@/types/database'

export type FinanceSummary = {
  receitas: number
  gastos: number
  saldo: number
}

/** Soma receitas/gastos e calcula o saldo do período carregado. */
export function computeFinanceSummary(finances: Finance[]): FinanceSummary {
  let receitas = 0
  let gastos = 0

  for (const f of finances) {
    if (f.tipo === 'receita') receitas += f.valor
    else gastos += f.valor
  }

  return { receitas, gastos, saldo: receitas - gastos }
}
