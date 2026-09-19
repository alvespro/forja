/** Estimativa MET: kcal = MET × 3,5 × peso(kg) / 200 × minutos. */
export function estimateWorkoutCalories(durationSeconds: number, weightKg: number | null, rpe: number | null): number | null {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !weightKg || weightKg <= 0) return null
  const met = !rpe ? 4.5 : rpe <= 4 ? 3.5 : rpe <= 7 ? 5 : 6
  return Math.round((met * 3.5 * weightKg * (durationSeconds / 60)) / 200)
}
