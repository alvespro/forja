import { useMutation, useQueryClient } from '@tanstack/react-query'

import { todayInSaoPaulo } from '@/lib/date'
import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
import type { HealthMetric } from '@/types/database'

import { useAuth } from './use-auth'

const healthMetricsCrud = createCrudHooks<HealthMetric, never>({
  table: 'health_metrics',
  queryKey: 'health-metrics',
  orderBy: { column: 'measured_at', ascending: true },
})

export const useHealthMetrics = healthMetricsCrud.useList

/** Agrupa as leituras por chave do marcador, em ordem cronológica. */
export function groupHealthMetricsByKey(metrics: HealthMetric[] | undefined): Map<string, HealthMetric[]> {
  const map = new Map<string, HealthMetric[]>()
  if (!metrics) return map

  for (const metric of metrics) {
    const list = map.get(metric.chave) ?? []
    list.push(metric)
    map.set(metric.chave, list)
  }

  return map
}

export function getLatestValue(metrics: HealthMetric[]): number | null {
  if (metrics.length === 0) return null
  return metrics[metrics.length - 1].valor
}

export type CreateHealthMetricInput = {
  chave: string
  valor: number
  measured_at?: string
}

/** Mantido próprio: preenche measured_at com o dia de hoje (fuso SP) quando omitido. */
export function useCreateHealthMetric() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chave, valor, measured_at }: CreateHealthMetricInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('health_metrics').insert({
        chave,
        valor,
        measured_at: measured_at ?? todayInSaoPaulo(),
        user_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-metrics'] }),
  })
}
