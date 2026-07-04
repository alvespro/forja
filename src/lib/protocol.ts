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

/** Campos de exame necessários para decidir atraso (subconjunto de ProtocolExam). */
export type ExamOverdueInput = {
  status: string | null
  data_prevista: string | null
  semana_alvo: number | null
}

/**
 * Exame atrasado: pela data prevista quando existe; senão pela semana-alvo,
 * vencida a partir da 1ª semana seguinte do protocolo. Sem data de início do
 * protocolo não há como converter semana em prazo — não acusa atraso.
 */
export function isExamOverdue(exam: ExamOverdueInput, dataInicio: string | null | undefined, today: string): boolean {
  if (exam.status === 'realizado') return false
  if (exam.data_prevista) return exam.data_prevista < today
  if (exam.semana_alvo == null || !dataInicio) return false
  return computeWeekNumber(dataInicio, today) > exam.semana_alvo
}
