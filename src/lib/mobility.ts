import type { MobilityContexto } from '@/types/database'

/**
 * Regras das rotinas de mobilidade: rótulos, progresso da execução e a decisão
 * do Hoje diante de recuperação baixa.
 */

export const CONTEXTO_INFO: Record<MobilityContexto, { icone: string; label: string }> = {
  manha: { icone: '🌅', label: 'Manhã' },
  pre_forca: { icone: '🏋️', label: 'Antes da força' },
  pre_corrida: { icone: '🏃', label: 'Antes da corrida' },
  pos_treino: { icone: '🧊', label: 'Pós-treino' },
  recuperacao: { icone: '🌿', label: 'Recuperação' },
  qualquer: { icone: '🧘', label: 'Qualquer hora' },
}

export const TEMPOS_POR_EXERCICIO = [30, 45, 60] as const

/** XP concedido ao concluir uma rotina (registrado em xp_logs). */
export const XP_MOBILIDADE = 15

/** "Exercício 2 de 5 · 3min restantes" — o restante inclui o exercício atual. */
export function progressoRotina(indice: number, total: number, segundosPorExercicio: number, restanteAtualSeg: number): string {
  const depois = Math.max(0, total - indice - 1) * segundosPorExercicio
  const restante = Math.max(0, restanteAtualSeg) + depois
  const min = Math.ceil(restante / 60)
  const tempo = restante < 60 ? `${Math.ceil(restante)}s restantes` : `${min}min restantes`
  return `Exercício ${indice + 1} de ${total} · ${tempo}`
}

export type GateRecuperacao = 'critico' | 'adaptado' | null

/**
 * Card do Hoje antes da ação principal:
 * - score < 40 → descanso ativo, sem opção de força;
 * - score < 60 com treino de força programado → sugerir mobilidade (a menos que
 *   o usuário já tenha escolhido treinar mesmo);
 * - demais casos → nada (≥ 80 é treino pesado confirmado).
 */
export function gateRecuperacao(input: {
  score: number | null
  treinoProgramado: boolean
  decisao: 'mobilidade' | 'treino' | null
}): GateRecuperacao {
  if (input.score == null) return null
  if (input.score < 40) return 'critico'
  if (input.score < 60 && input.treinoProgramado && input.decisao !== 'treino') return 'adaptado'
  return null
}

/** O hábito que abre a ativação matinal ("Mover o corpo"). */
export function ehHabitoDeMovimento(nome: string): boolean {
  const n = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return /mover o corpo|movimento|mobilidade/.test(n)
}
