/** Distância do indicador (px) que dispara a atualização ao soltar — com a resistência de 50%, o dedo puxa 80px. */
export const PULL_THRESHOLD = 40
/** Distância máxima que o indicador acompanha o dedo. */
export const PULL_MAX = 110

/** Resistência elástica: o indicador anda metade do dedo, até o máximo. */
export function pullDistance(deltaY: number): number {
  if (deltaY <= 0) return 0
  return Math.min(PULL_MAX, deltaY * 0.5)
}
