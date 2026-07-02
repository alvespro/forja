import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import type { ProtocolGoal } from '@/types/database'

export function useProtocolGoals(protocolId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-goals', protocolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocol_goals')
        .select('*')
        .eq('protocol_id', protocolId!)
        .maybeSingle()
      if (error) throw error
      return data as ProtocolGoal | null
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolGoalInput = {
  protocol_id: string
  peso_inicial_kg?: number | null
  peso_meta_kg?: number | null
  gordura_inicial_pct?: number | null
  gordura_meta_pct?: number | null
  musculo_inicial_kg?: number | null
  musculo_meta_kg?: number | null
  forca_meta?: string | null
  notas?: string | null
}

export function useCreateProtocolGoal() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProtocolGoalInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('protocol_goals').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-goals'] }),
  })
}
