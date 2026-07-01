import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { Protocol, ProtocolStatus } from '@/types/database'

export function useProtocols() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocols'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Protocol[]
    },
    enabled: !!user,
  })
}

export function useActiveProtocol() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocols', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .in('status', ['planejado', 'ativo', 'tpc'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Protocol | null
    },
    enabled: !!user,
  })
}

export type ProtocolInput = {
  nome: string
  objetivo: string
  status?: ProtocolStatus
  via?: string
  medico_responsavel?: string | null
  data_inicio?: string | null
  data_fim_prevista?: string | null
  duracao_semanas?: number | null
  notas?: string | null
}

export function useUpdateProtocol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ProtocolInput> }) => {
      const { error } = await supabase.from('protocols').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocols'] })
    },
  })
}
