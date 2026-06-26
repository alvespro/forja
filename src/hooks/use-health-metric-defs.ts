import { createCrudHooks } from '@/lib/crud-factory'
import type { HealthMetricDef } from '@/types/database'

const healthMetricDefsCrud = createCrudHooks<HealthMetricDef, never>({
  table: 'health_metric_defs',
  queryKey: 'health-metric-defs',
  orderBy: { column: 'label' },
})

export const useHealthMetricDefs = healthMetricDefsCrud.useList
