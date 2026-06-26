import { useQuery } from '@tanstack/react-query'

import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
import type { Goal, GoalArea, GoalStatus } from '@/types/database'

import { useAuth } from './use-auth'

export const ALL_CYCLES = 'all'

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

const goalsCrud = createCrudHooks<Goal, GoalInput>({
  table: 'goals',
  queryKey: 'goals',
  orderBy: { column: 'created_at' },
})

export const useCreateGoal = goalsCrud.useCreate
export const useUpdateGoal = goalsCrud.useUpdate
export const useDeleteGoal = goalsCrud.useDelete

/** Lista filtrada por ciclo — usa query key própria pois o filtro muda o resultado. */
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
