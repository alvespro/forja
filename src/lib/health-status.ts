import type { HealthMetricDef } from '@/types/database'

export type HealthStatus = 'ok' | 'atencao' | 'sem_meta'

/**
 * Seção 7 do SPEC: verde = dentro da meta, âmbar = fora da meta.
 * Sem `valor_meta` definido não há como julgar a leitura (sem_meta).
 */
export function calculateHealthStatus(
  def: Pick<HealthMetricDef, 'direcao' | 'valor_meta'>,
  latestValue: number | null,
): HealthStatus {
  if (latestValue === null || def.valor_meta === null || !def.direcao) {
    return 'sem_meta'
  }

  const dentroDaMeta =
    def.direcao === 'menor_melhor' ? latestValue <= def.valor_meta : latestValue >= def.valor_meta

  return dentroDaMeta ? 'ok' : 'atencao'
}
