import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Goal, GoalArea, GoalStatus } from '@/types/database'

import { useAuth } from './use-auth'

export const ALL_CYCLES = 'all'

export function useGoals(cycleId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['goals', cycleId],
    queryFn: async () => {
      let query = supabase.from('goals').select('*').order('created_at')
      if (cycleId !== ALL_CYCLES) {
        query = query.eq('cycle_id', cycleId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Goal[]
    },
    enabled: !!user,
  })
}

export type GoalInput = {
  titulo: string
  area: GoalArea
  cycle_id: string | null
  resultado_rpm: string
  proposito_rpm: string
  plano_rpm: string
  progresso: number
  status: GoalStatus
}

export function useCreateGoal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: GoalInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('goals').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GoalInput }) => {
      const { error } = await supabase.from('goals').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })
}
