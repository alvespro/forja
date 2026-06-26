import type { Goal, KeyResult } from '@/types/database'

/**
 * Seção 6.2 do SPEC: se a meta tem key_results, progresso = média(
 * min(valor_atual / valor_meta, 1) ) * 100. Sem key_results, usa o
 * campo `progresso` manual da meta.
 */
export function calculateGoalProgress(goal: Pick<Goal, 'progresso'>, keyResults: KeyResult[]): number {
  if (keyResults.length === 0) {
    return goal.progresso
  }

  const media =
    keyResults.reduce((sum, kr) => {
      const razao = kr.valor_meta > 0 ? kr.valor_atual / kr.valor_meta : kr.valor_atual > 0 ? 1 : 0
      return sum + Math.min(razao, 1)
    }, 0) / keyResults.length

  return Math.round(media * 100)
}
