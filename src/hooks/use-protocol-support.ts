import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { ProtocolSupport } from '@/types/database'

export function useProtocolSupport(protocolId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-support', protocolId],
    queryFn: async () => {
      const q = supabase.from('protocol_support').select('*').order('categoria', { ascending: true })
      if (protocolId) q.eq('protocol_id', protocolId)
      const { data, error } = await q
      if (error) throw error
      return data as ProtocolSupport[]
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolSupportInput = {
  protocol_id: string
  nome: string
  categoria?: string | null
  dose?: string | null
  momento?: string | null
  motivo?: string | null
  semana_inicio?: number | null
  semana_fim?: number | null
  ativo?: boolean
}

export function useCreateProtocolSupport() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProtocolSupportInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('protocol_support').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-support'] }),
  })
}
