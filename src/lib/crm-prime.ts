import type { CrmClient } from '@/types/database'
export const PRIME_STAGES = { lead: 'Lead', proposta: 'Proposta', aprovado: 'Aprovado', concluido: 'Concluído' } as const
export type PrimeStage = keyof typeof PRIME_STAGES
export const PRODUCTS = { MCMV: '#4CAF7D', SBPE: '#3B82F6', Consignado: '#E8A23D', Consórcio: '#8B5CF6' }
export const LEGACY_PHASE: Record<PrimeStage, string> = { lead: 'prospecção', proposta: 'proposta', aprovado: 'negociação', concluido: 'fechado' }
export function prime_stage(c: Pick<CrmClient, 'status' | 'fase'>): PrimeStage {
  if (c.status && c.status in PRIME_STAGES && c.status !== 'lead') return c.status as PrimeStage
  if (c.fase === 'fechado') return 'concluido'
  if (c.fase === 'negociação') return 'aprovado'
  if (['proposta', 'visita'].includes(c.fase ?? '')) return 'proposta'
  return 'lead'
}
