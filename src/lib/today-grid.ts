import type { StatusDotColor } from '@/components/ds/status-dot'
import { parseDateOnly } from '@/lib/date'

/** Dias inteiros entre duas datas yyyy-MM-dd (0 = mesmo dia). */
export function diasDesde(data: string, hoje: string): number {
  const ms = parseDateOnly(hoje).getTime() - parseDateOnly(data).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Rótulo curto e cor do score de recuperação (mesmas faixas de classifyRecovery). */
export function statusRecuperacao(score: number): { label: string; cor: StatusDotColor; tom: 'ok' | 'brasa' | 'alerta' } {
  if (score >= 80) return { label: 'Treino pesado', cor: 'ok', tom: 'ok' }
  if (score >= 60) return { label: 'Moderado', cor: 'brasa', tom: 'brasa' }
  if (score >= 40) return { label: 'Treino leve', cor: 'brasa', tom: 'brasa' }
  return { label: 'Descanso ativo', cor: 'alerta', tom: 'alerta' }
}
