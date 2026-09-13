import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { MealLog } from '@/types/database'

export type MealLogInput = {
  meal_slot_id: string | null
  data: string
  descricao: string | null
  calorias: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  /** Vínculo com o catálogo (`foods`) quando veio do Open Food Facts. */
  food_id?: string | null
}

/** Refeições registradas hoje (fuso America/Sao_Paulo), de qualquer fonte (manual ou Yazio). */
export function useMealLogsToday() {
  const { user } = useAuth()
  const today = todayInSaoPaulo()

  return useQuery({
    queryKey: ['meal-logs', today],
    queryFn: async () => {
      const { data, error } = await supabase.from('meal_logs').select('*').eq('data', today)
      if (error) throw error
      return data as MealLog[]
    },
    enabled: !!user,
  })
}

/** Refeições dos últimos `days` dias — score retroativo e visão comida×corpo. */
export function useMealLogsRange(days = 8) {
  const { user } = useAuth()
  const today = todayInSaoPaulo()

  return useQuery({
    queryKey: ['meal-logs', 'range', days, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('data, calorias, proteina_g')
        .gte('data', addDaysToDateString(today, -days))
      if (error) throw error
      return data as Pick<MealLog, 'data' | 'calorias' | 'proteina_g'>[]
    },
    enabled: !!user,
  })
}

export function useCreateMealLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: MealLogInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('meal_logs').insert({ ...values, user_id: user.id, fonte: 'manual' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-logs'] }),
  })
}

export function useDeleteMealLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meal_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-logs'] }),
  })
}
