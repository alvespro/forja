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

/** Lançamentos do mês (ym = 'YYYY-MM'). */
export function filterByMonth(finances: Finance[], ym: string): Finance[] {
  return finances.filter((f) => f.data.startsWith(ym))
}

/** Meses com lançamentos, mais recente primeiro (para o seletor). */
export function monthsAvailable(finances: Finance[]): string[] {
  const set = new Set(finances.map((f) => f.data.slice(0, 7)))
  return [...set].sort().reverse()
}

/** Gastos do mês agrupados por categoria, maior primeiro. */
export function gastosPorCategoria(finances: Finance[]): { categoria: string; total: number }[] {
  const map = new Map<string, number>()
  for (const f of finances) {
    if (f.tipo !== 'gasto') continue
    const cat = f.categoria?.trim() || 'sem categoria'
    map.set(cat, (map.get(cat) ?? 0) + f.valor)
  }
  return [...map.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}
