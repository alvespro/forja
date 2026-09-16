import type { WorkoutFase } from '@/types/database'

/** Ordem de execução das fases de um treino v2. */
export const FASES_EM_ORDEM: WorkoutFase[] = ['aquecimento', 'mobilidade', 'treino', 'cardio', 'cooldown']

export const FASE_LABEL: Record<WorkoutFase, string> = {
  aquecimento: 'Aquecimento',
  mobilidade: 'Mobilidade',
  treino: 'Treino',
  cardio: 'Cardio',
  cooldown: 'Volta à calma',
}

/** Fases guiadas por cronômetro (sem carga): o exercício avança sozinho ao zerar. */
export function faseCronometrada(fase: WorkoutFase): boolean {
  return fase === 'aquecimento' || fase === 'mobilidade' || fase === 'cooldown'
}

/** Fase do exercício; nula ou desconhecida conta como treino (default da coluna). */
export function faseDe(fase: string | null | undefined): WorkoutFase {
  return (FASES_EM_ORDEM as string[]).includes(fase ?? '') ? (fase as WorkoutFase) : 'treino'
}

/** Ordena por fase e, dentro dela, pela ordem cadastrada (sem mutar a lista original). */
export function ordenarPorFase<T extends { fase: string | null; ordem: number }>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) => FASES_EM_ORDEM.indexOf(faseDe(a.fase)) - FASES_EM_ORDEM.indexOf(faseDe(b.fase)) || a.ordem - b.ordem,
  )
}

type Reps = { reps_min: number | null; reps_max: number | null; reps_alvo: string | null }

/** Meta de reps para exibição: "8-12 reps", "80 reps"; cai para reps_alvo dos treinos antigos. */
export function metaReps({ reps_min, reps_max, reps_alvo }: Reps): string | null {
  if (reps_min != null && reps_max != null) return reps_min === reps_max ? `${reps_max} reps` : `${reps_min}-${reps_max} reps`
  if (reps_max != null || reps_min != null) return `${reps_max ?? reps_min} reps`
  return reps_alvo?.trim() ? `${reps_alvo.trim()} reps` : null
}

/** Topo da faixa de reps (base da sugestão de sobrecarga). */
export function repsAlvoMax({ reps_min, reps_max, reps_alvo }: Reps): number | null {
  if (reps_max != null) return reps_max
  if (reps_min != null) return reps_min
  const numeros = reps_alvo?.match(/\d+/g)
  return numeros ? Math.max(...numeros.map(Number)) : null
}

/** "8-12" → {8, 12}; "15" → {15, 15}; texto sem número → nulos. */
export function parseRepsRange(texto: string | null | undefined): { min: number | null; max: number | null } {
  const numeros = texto?.match(/\d+/g)?.map(Number) ?? []
  if (numeros.length === 0) return { min: null, max: null }
  return { min: Math.min(...numeros), max: Math.max(...numeros) }
}

/** Minutos de mobilidade pré-treino (arredondado para cima); null quando o treino não tem essa fase. */
export function minutosMobilidade(lista: { fase: string | null; tempo_seg?: number | null }[]): number | null {
  const mobilidade = lista.filter((p) => faseDe(p.fase) === 'mobilidade')
  if (mobilidade.length === 0) return null
  const segundos = mobilidade.reduce((acc, p) => acc + (p.tempo_seg ?? 0), 0)
  return Math.max(1, Math.ceil(segundos / 60))
}

/**
 * Observação da prescrição dividida em rótulo (o trecho inicial em caixa alta, ex.:
 * "TRIO ATIVADOR", "PAR 4 DROP SET", "SUPERSET") e detalhe (o resto do texto).
 */
export function destaqueObservacao(texto: string | null | undefined): { rotulo: string | null; detalhe: string | null } | null {
  const limpo = texto?.trim()
  if (!limpo) return null
  const [inicio, ...resto] = limpo.split(/\s+[—–-]\s+/)
  const ehRotulo = /^[A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 /+]*$/.test(inicio) && /[A-ZÀ-Ý]{2,}/.test(inicio)
  if (!ehRotulo) return { rotulo: null, detalhe: limpo }
  const detalhe = resto.join(' — ').trim()
  return { rotulo: inicio.trim(), detalhe: detalhe || null }
}

type Prescricao = Reps & {
  fase: string | null
  series_alvo: number | null
  tempo_seg: number | null
  pausa_alvo_seg: number | null
  cadencia_alvo: string | null
}

/** Linha curta da prescrição: "Mobilidade · 60s", "4×8-12 reps · pausa 60s", "Cardio · 18 min". */
export function resumoPrescricao(p: Prescricao): string {
  const fase = faseDe(p.fase)
  const tempo = p.tempo_seg ? (p.tempo_seg >= 120 ? `${Math.round(p.tempo_seg / 60)} min` : `${p.tempo_seg}s`) : null
  if (fase !== 'treino') return [FASE_LABEL[fase], tempo].filter(Boolean).join(' · ')
  const meta = metaReps(p) ?? tempo ?? '—'
  const partes = [`${p.series_alvo ?? '—'}×${meta}`]
  if (p.pausa_alvo_seg) partes.push(`pausa ${p.pausa_alvo_seg}s`)
  if (p.cadencia_alvo) partes.push(`cadência ${p.cadencia_alvo}`)
  return partes.join(' · ')
}
