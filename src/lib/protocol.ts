/**
 * Número da semana do protocolo a partir da data de início.
 * Semana 1 começa em data_inicio; antes do início (ou sem data) retorna 0.
 */
export function computeWeekNumber(dataInicio: string | null | undefined, today: string): number {
  if (!dataInicio) return 0
  const start = new Date(dataInicio + 'T12:00:00')
  const now = new Date(today + 'T12:00:00')
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)
}
