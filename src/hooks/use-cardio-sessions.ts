import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { CardioSession, CardioTipo } from '@/types/database'

import { useAuth } from './use-auth'

export function useCardioSessions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cardio-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cardio_sessions')
        .select('*')
        .order('performed_at', { ascending: false })
      if (error) throw error
      return data as CardioSession[]
    },
    enabled: !!user,
  })
}

export type CardioSessionInput = {
  tipo: CardioTipo | null
  performed_at: string
  distancia_km: number | null
  duracao_seg: number | null
  fc_media: number | null
  zona: string | null
  tiros: string | null
  notas: string | null
}

export function useCreateCardioSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CardioSessionInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('cardio_sessions').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cardio-sessions'] }),
  })
}

export function useDeleteCardioSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cardio_sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cardio-sessions'] }),
  })
}
