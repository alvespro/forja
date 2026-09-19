export const MET_TABLE: Record<string, number> = {
  peito: 5,
  costas: 5,
  pernas: 6,
  ombro: 4.5,
  ombros: 4.5,
  biceps: 3.5,
  bíceps: 3.5,
  triceps: 3.5,
  tríceps: 3.5,
  gluteo: 5.5,
  glúteo: 5.5,
  core: 4,
  abdomen: 4,
  abdômen: 4,
  panturrilha: 3,
  cardio: 7.5,
  mobilidade: 2.5,
}

/** Estimativa MET por grupos trabalhados: MET médio × peso × duração em horas. */
export function estimateWorkoutCalories(durationSeconds: number, weightKg: number | null, groups: string[]): number | null {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !weightKg || weightKg <= 0) return null
  const mets = groups.map((group) => MET_TABLE[group.trim().toLocaleLowerCase('pt-BR')]).filter((met): met is number => met != null)
  const averageMet = mets.length ? mets.reduce((total, met) => total + met, 0) / mets.length : 4.5
  return Math.round(averageMet * weightKg * (durationSeconds / 3600))
}
