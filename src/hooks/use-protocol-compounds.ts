import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { ProtocolCompound } from '@/types/database'

export function useProtocolCompounds(protocolId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-compounds', protocolId],
    queryFn: async () => {
      const q = supabase.from('protocol_compounds').select('*').order('ordem', { ascending: true })
      if (protocolId) q.eq('protocol_id', protocolId)
      const { data, error } = await q
      if (error) throw error
      return data as ProtocolCompound[]
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolCompoundInput = {
  protocol_id: string
  nome: string
  categoria?: string | null
  dose_mg?: number | null
  frequencia?: string | null
  via?: string | null
  semana_inicio?: number | null
  semana_fim?: number | null
  notas?: string | null
  ordem?: number | null
}

export function useCreateProtocolCompound() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProtocolCompoundInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('protocol_compounds').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-compounds'] }),
  })
}

export function useUpdateProtocolCompound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProtocolCompoundInput }) => {
      const { error } = await supabase.from('protocol_compounds').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-compounds'] }),
  })
}

export function useDeleteProtocolCompound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('protocol_compounds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-compounds'] }),
  })
}
