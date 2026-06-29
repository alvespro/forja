import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useActiveCycle } from '@/hooks/use-active-cycle'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { BodyGoal, Cycle, ObjetivoCorporal } from '@/types/database'

export type BodyGoalWithCycle = BodyGoal & { cycle: Cycle }

/** Meta de composição corporal do ciclo ativo do sistema (mesmo ciclo usado pelas metas RPM). */
export function useActiveBodyGoal() {
  const { user } = useAuth()
  const activeCycle = useActiveCycle()
  const cycleId = activeCycle.data?.id

  const query = useQuery({
    queryKey: ['body-goals', 'by-cycle', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_goals')
        .select('*')
        .eq('cycle_id', cycleId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as BodyGoal | null
    },
    enabled: !!user && !!cycleId,
  })

  return {
    ...query,
    isLoading: query.isLoading || activeCycle.isLoading,
    isError: query.isError || activeCycle.isError,
    data: query.data && activeCycle.data ? ({ ...query.data, cycle: activeCycle.data } as BodyGoalWithCycle) : null,
  }
}

export type BodyGoalUpsertInput = {
  nome: string
  objetivo: ObjetivoCorporal
  data_inicio: string
  prazo_dias: number
  peso_meta_kg: number | null
  gordura_meta_pct: number | null
  musculo_pct_meta: number | null
  agua_meta_pct: number | null
  gordura_visceral_meta: number | null
  imc_meta: number | null
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Cria um novo ciclo + meta de composição corporal, desativando o ciclo anterior (se houver). */
export function useUpsertBodyGoal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: BodyGoalUpsertInput) => {
      if (!user) throw new Error('Usuário não autenticado')

      const { error: deactivateError } = await supabase
        .from('cycles')
        .update({ ativo: false })
        .eq('user_id', user.id)
        .eq('ativo', true)
      if (deactivateError) throw deactivateError

      const { data: cycle, error: cycleError } = await supabase
        .from('cycles')
        .insert({
          user_id: user.id,
          nome: values.nome,
          data_inicio: values.data_inicio,
          data_fim: addDays(values.data_inicio, values.prazo_dias),
          ativo: true,
        })
        .select()
        .single()
      if (cycleError) throw cycleError

      const { error: goalError } = await supabase.from('body_goals').insert({
        user_id: user.id,
        cycle_id: cycle.id,
        objetivo: values.objetivo,
        peso_meta_kg: values.peso_meta_kg,
        gordura_meta_pct: values.gordura_meta_pct,
        musculo_pct_meta: values.musculo_pct_meta,
        agua_meta_pct: values.agua_meta_pct,
        gordura_visceral_meta: values.gordura_visceral_meta,
        imc_meta: values.imc_meta,
      })
      if (goalError) throw goalError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-goals'] })
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
      queryClient.invalidateQueries({ queryKey: ['active-cycle'] })
    },
  })
}
