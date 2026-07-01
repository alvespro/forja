import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

import { useAuth } from './use-auth'

export function useFrogTask() {
  const { user } = useAuth()
  const today = todayInSaoPaulo()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['frog-task', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('data', today)
        .eq('e_frog', true)
        .order('id')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Task | null
    },
    enabled: !!user,
  })

  const create = useMutation({
    mutationFn: async (titulo: string) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('tasks').insert({
        titulo,
        user_id: user.id,
        e_frog: true,
        data: today,
        status: 'aberto',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frog-task', today] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const toggleDone = useMutation({
    mutationFn: async () => {
      if (!query.data) return
      const novoStatus = query.data.status === 'feito' ? 'aberto' : 'feito'
      const { error } = await supabase
        .from('tasks')
        .update({ status: novoStatus })
        .eq('id', query.data.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frog-task', today] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return { ...query, create, toggleDone }
}
