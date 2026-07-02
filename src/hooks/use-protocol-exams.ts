import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { ProtocolExam, ProtocolExamStatus } from '@/types/database'

export function useProtocolExams(protocolId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-exams', protocolId],
    queryFn: async () => {
      const q = supabase
        .from('protocol_exams')
        .select('*')
        .order('semana_alvo', { ascending: true })
      if (protocolId) q.eq('protocol_id', protocolId)
      const { data, error } = await q
      if (error) throw error
      return data as ProtocolExam[]
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolExamInput = {
  protocol_id: string
  nome: string
  tipo?: string | null
  semana_alvo?: number | null
  status?: ProtocolExamStatus
}

export function useCreateProtocolExams() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (exams: ProtocolExamInput[]) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase
        .from('protocol_exams')
        .insert(exams.map((e) => ({ ...e, user_id: user.id })))
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-exams'] }),
  })
}

export function useUpdateProtocolExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: {
        status?: ProtocolExamStatus
        data_prevista?: string | null
        data_realizada?: string | null
        observacoes?: string | null
        health_metric_snapshot?: Record<string, unknown> | null
      }
    }) => {
      const { error } = await supabase.from('protocol_exams').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-exams'] }),
  })
}
