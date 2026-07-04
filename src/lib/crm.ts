import type { CrmClient } from '@/types/database'

/**
 * Funil fixo do negócio imobiliário. Fase era texto livre — "proposta" e
 * "Proposta" viravam fases diferentes e o filtro fragmentava o pipeline.
 */
export const FASES_FUNIL = [
  'prospecção',
  'visita',
  'proposta',
  'negociação',
  'fechado',
  'perdido',
] as const

/**
 * Ordena por urgência: próxima ação vencida/mais próxima primeiro, sem data
 * por último (antes era created_at desc — o cliente urgente ficava no fundo).
 */
export function sortByProximaAcao(clients: CrmClient[]): CrmClient[] {
  return [...clients].sort((a, b) => {
    if (a.data_proxima_acao && b.data_proxima_acao) {
      return a.data_proxima_acao.localeCompare(b.data_proxima_acao)
    }
    if (a.data_proxima_acao) return -1
    if (b.data_proxima_acao) return 1
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

/** Ação vencida (data no passado) — destacada em alerta na lista. */
export function isAcaoAtrasada(client: CrmClient, today: string): boolean {
  return !!client.data_proxima_acao && client.data_proxima_acao < today
}
