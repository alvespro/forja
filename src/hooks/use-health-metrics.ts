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

export type LeituraNova = { chave: string; valor: number }

/**
 * Grava um exame (várias leituras na mesma data). Leitura com a mesma chave e data vira
 * UPDATE em vez de duplicar — relançar o mesmo laudo não dobra o placar.
 */
export async function salvarLeiturasDeSaude(userId: string, measuredAt: string, leituras: LeituraNova[]) {
  if (leituras.length === 0) return { inseridas: 0, atualizadas: 0 }
  const chaves = [...new Set(leituras.map((l) => l.chave))]
  const { data: existentes, error: erroBusca } = await supabase
    .from('health_metrics')
    .select('id, chave')
    .eq('measured_at', measuredAt)
    .in('chave', chaves)
  if (erroBusca) throw erroBusca

  const idPorChave = new Map((existentes ?? []).map((e) => [e.chave as string, e.id as string]))
  const novas = leituras.filter((l) => !idPorChave.has(l.chave))
  const repetidas = leituras.filter((l) => idPorChave.has(l.chave))

  if (novas.length > 0) {
    const { error } = await supabase
      .from('health_metrics')
      .insert(novas.map((l) => ({ user_id: userId, chave: l.chave, valor: l.valor, measured_at: measuredAt })))
    if (error) throw error
  }
  for (const l of repetidas) {
    const { error } = await supabase.from('health_metrics').update({ valor: l.valor }).eq('id', idPorChave.get(l.chave)!)
    if (error) throw error
  }
  return { inseridas: novas.length, atualizadas: repetidas.length }
}

export type RegistrarExameInput = {
  measuredAt: string
  leituras: LeituraNova[]
  /** Marcadores digitados em "Outro": ganham definição para aparecer em "Outros marcadores". */
  novasDefinicoes?: { chave: string; label: string; unidade: string | null }[]
}

export function useRegistrarExame() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ measuredAt, leituras, novasDefinicoes = [] }: RegistrarExameInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      if (novasDefinicoes.length > 0) {
        const { data: jaExistem, error } = await supabase
          .from('health_metric_defs')
          .select('chave')
          .in('chave', novasDefinicoes.map((d) => d.chave))
        if (error) throw error
        const faltam = novasDefinicoes.filter((d) => !(jaExistem ?? []).some((e) => e.chave === d.chave))
        if (faltam.length > 0) {
          const { error: erroDef } = await supabase
            .from('health_metric_defs')
            .insert(faltam.map((d) => ({ ...d, user_id: user.id, direcao: null, valor_meta: null })))
          if (erroDef) throw erroDef
        }
      }
      return salvarLeiturasDeSaude(user.id, measuredAt, leituras)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['health-metric-defs'] })
    },
  })
}

export function useUpdateHealthMetric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, valor, measured_at }: { id: string; valor: number; measured_at: string }) => {
      const { error } = await supabase.from('health_metrics').update({ valor, measured_at }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-metrics'] }),
  })
}

export function useDeleteHealthMetric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('health_metrics').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-metrics'] }),
  })
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
