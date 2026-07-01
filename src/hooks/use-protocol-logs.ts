import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { ProtocolLog } from '@/types/database'

export function useProtocolLogs(protocolId?: string, limit = 90) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-logs', protocolId],
    queryFn: async () => {
      const q = supabase
        .from('protocol_logs')
        .select('*')
        .order('data_aplicacao', { ascending: false })
        .limit(limit)
      if (protocolId) q.eq('protocol_id', protocolId)
      const { data, error } = await q
      if (error) throw error
      return data as ProtocolLog[]
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolLogInput = {
  protocol_id: string
  compound_id?: string | null
  data_aplicacao?: string
  dose_aplicada_mg?: number | null
  local_aplicacao?: string | null
  humor?: number | null
  energia?: number | null
  libido?: number | null
  efeitos_percebidos?: string | null
  observacoes?: string | null
}

export function useCreateProtocolLog() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProtocolLogInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('protocol_logs').insert({
        ...values,
        user_id: user.id,
        data_aplicacao: values.data_aplicacao ?? todayInSaoPaulo(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-logs'] }),
  })
}
