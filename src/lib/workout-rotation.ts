/**
 * Próximo treino na rotação: o que vem depois do treino da sessão mais recente,
 * na ordem definida. Sem sessões (ou treino anterior removido), começa do primeiro.
 */
export function pickTodaysWorkout<T extends { id: string; ordem: number }>(
  activeWorkouts: T[],
  lastWorkoutId: string | null,
): T | null {
  if (activeWorkouts.length === 0) return null
  if (!lastWorkoutId) return activeWorkouts[0]
  const lastIndex = activeWorkouts.findIndex((w) => w.id === lastWorkoutId)
  if (lastIndex === -1) return activeWorkouts[0]
  return activeWorkouts[(lastIndex + 1) % activeWorkouts.length]
}
