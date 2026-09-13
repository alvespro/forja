// Determina, pela hora atual, qual refeição é "a de agora" e qual é a próxima.

export type SchedulableSlot = {
  id: string
  numero: number
  horario_alvo: string | null // 'HH:MM:SS' ou 'HH:MM'
}

export type MealTiming = {
  currentId: string | null
  nextId: string | null
}

/** Converte 'HH:MM[:SS]' em minutos desde a meia-noite; null se inválido. */
export function horarioToMinutes(horario: string | null): number | null {
  if (!horario) return null
  const [h, m] = horario.split(':').map((n) => Number(n))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * A refeição "atual" é a última cujo horário já passou (a que você deveria estar fazendo);
 * antes da primeira do dia, a atual é a primeira. A próxima é a seguinte na ordem.
 */
export function classifyMeals(slots: SchedulableSlot[], nowMinutes: number): MealTiming {
  const ordered = [...slots].sort((a, b) => a.numero - b.numero)
  if (ordered.length === 0) return { currentId: null, nextId: null }

  let currentIndex = 0
  for (let i = 0; i < ordered.length; i++) {
    const minutes = horarioToMinutes(ordered[i].horario_alvo)
    if (minutes !== null && minutes <= nowMinutes) currentIndex = i
  }

  // Antes da primeira refeição do dia: a atual é a primeira.
  const firstMinutes = horarioToMinutes(ordered[0].horario_alvo)
  const beforeFirst = firstMinutes !== null && nowMinutes < firstMinutes
  if (beforeFirst) currentIndex = 0

  const current = ordered[currentIndex]
  const next = ordered[currentIndex + 1] ?? null
  return { currentId: current?.id ?? null, nextId: next?.id ?? null }
}
