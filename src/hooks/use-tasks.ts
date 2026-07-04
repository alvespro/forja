import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

import { useAuth } from './use-auth'

export type TaskInput = {
  titulo: string
  area?: string | null
  e_frog?: boolean
  data?: string
  goal_id?: string | null
}

type TaskFilters = {
  area?: string
  data?: string
}

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['tasks', filters],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('data', { ascending: false })
        .order('e_frog', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.area) q = q.eq('area', filters.area)
      if (filters?.data) q = q.eq('data', filters.data)

      const { data, error } = await q
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const today = todayInSaoPaulo()

  return useMutation({
    mutationFn: async (input: TaskInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('tasks').insert({
        titulo: input.titulo,
        area: input.area ?? null,
        e_frog: input.e_frog ?? false,
        data: input.data ?? today,
        goal_id: input.goal_id ?? null,
        status: 'aberto',
        user_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['frog-task'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Omit<Task, 'id' | 'user_id'>> }) => {
      const { error } = await supabase.from('tasks').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['frog-task'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
