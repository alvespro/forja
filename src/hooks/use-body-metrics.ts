import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
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

/** Campos numéricos de body_metrics que o registro manual preenche. */
export const CAMPOS_MEDICAO = [
  'peso_kg',
  'gordura_pct',
  'musculo_pct',
  'agua_pct',
  'imc',
  'massa_ossea_kg',
  'tmb_kcal',
  'proteina_pct',
  'idade_corporal',
  'gordura_visceral',
  'gordura_subcutanea_pct',
  'gordura_corporal_kg',
  'peso_sem_gordura_kg',
  'peso_muscular_kg',
  'proteina_kg',
  'peso_ideal_kg',
] as const

export type CampoMedicao = (typeof CAMPOS_MEDICAO)[number]
export type MedicaoManual = { medido_em: string } & Partial<Record<CampoMedicao, number>>

/**
 * Registro manual: upsert por (user_id, medido_em). Só os campos preenchidos são enviados,
 * então completar uma medição do mesmo dia não apaga o que já estava lá. TGC = % de gordura.
 */
export function useSalvarMedicao() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (medicao: MedicaoManual) => {
      if (!user) throw new Error('Usuário não autenticado')
      const linha = {
        ...medicao,
        ...(medicao.gordura_pct != null ? { tgc_pct: medicao.gordura_pct } : {}),
        user_id: user.id,
        fonte: 'manual',
      }
      const { error } = await supabase.from('body_metrics').upsert(linha, { onConflict: 'user_id,medido_em' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['body-metrics'] }),
  })
}
