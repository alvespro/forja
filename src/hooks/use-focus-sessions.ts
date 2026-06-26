import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { FocusSession, FocusTechnique } from '@/types/database'

import { useAuth } from './use-auth'

const RECENT_LIMIT = 200

/** Sessões de foco recentes (últimas RECENT_LIMIT), mais recentes primeiro. */
export function useRecentFocusSessions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('data', { ascending: false })
        .limit(RECENT_LIMIT)
      if (error) throw error
      return data as FocusSession[]
    },
    enabled: !!user,
  })
}

export type CreateFocusSessionInput = {
  tarefa: string | null
  tecnica: FocusTechnique
  duracao_min: number
}

export function useCreateFocusSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFocusSessionInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('focus_sessions').insert({ ...input, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus-sessions'] }),
  })
}
