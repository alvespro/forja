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
export function useAiMessages(agente: string, limit = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ai-messages', agente],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('agente', agente)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data as AiMessage[]).reverse()
    },
    enabled: !!user,
  })
}

export function useInvalidateAiMessages() {
  const qc = useQueryClient()
  return (agente: string) => qc.invalidateQueries({ queryKey: ['ai-messages', agente] })
}
