/** Distância (px) que dispara a atualização ao soltar. */
export const PULL_THRESHOLD = 64
/** Distância máxima que o indicador acompanha o dedo. */
export const PULL_MAX = 110

/** Resistência elástica: o indicador anda metade do dedo, até o máximo. */
export function pullDistance(deltaY: number): number {
  if (deltaY <= 0) return 0
  return Math.min(PULL_MAX, deltaY * 0.5)
}
