import { createCrudHooks } from '@/lib/crud-factory'
import type { BodyMetric } from '@/types/database'

export type BodyMetricInput = {
  peso_kg: number | null
  gordura_pct: number | null
  musculo_pct: number | null
  agua_pct: number | null
  gordura_visceral: number | null
  imc: number | null
  medido_em: string
}

const bodyMetricsCrud = createCrudHooks<BodyMetric, BodyMetricInput>({
  table: 'body_metrics',
  queryKey: 'body-metrics',
  orderBy: { column: 'medido_em', ascending: true },
})

export const useBodyMetrics = bodyMetricsCrud.useList
export const useCreateBodyMetric = bodyMetricsCrud.useCreate
export const useDeleteBodyMetric = bodyMetricsCrud.useDelete
