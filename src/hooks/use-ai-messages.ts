import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type AiMessage = {
  id: string
  user_id: string
  agente: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/** Últimas mensagens da conversa com um agente, em ordem cronológica. */
export function useAiMessages(agente: string, limit = 30, enabled = true) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ai-messages', user?.id, agente, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user!.id)
        .eq('agente', agente)
        .order('created_at', { ascending: false })
        .order('role', { ascending: true })
        .limit(limit)
      if (error) throw error
      return (data as AiMessage[]).reverse()
    },
    enabled: !!user && enabled,
  })
}

export function useInvalidateAiMessages() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return (agente: string) => qc.invalidateQueries({ queryKey: ['ai-messages', user?.id, agente] })
}
