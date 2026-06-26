import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Workout } from '@/types/database'

import { useAuth } from './use-auth'

export function useWorkouts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workouts').select('*').order('ordem')
      if (error) throw error
      return data as Workout[]
    },
    enabled: !!user,
  })
}

export type WorkoutInput = {
  nome: string
  foco: string | null
  ordem: number
  ativo: boolean
}

export function useCreateWorkout() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: WorkoutInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('workouts').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: WorkoutInput }) => {
      const { error } = await supabase.from('workouts').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] }),
  })
}
