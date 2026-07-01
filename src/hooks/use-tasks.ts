import { useMutation, useQueryClient } from '@tanstack/react-query'

import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type TaskInput = {
  titulo: string
  area?: string | null
  e_frog?: boolean
  data?: string
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
