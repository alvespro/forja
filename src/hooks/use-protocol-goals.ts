import { useQuery } from '@tanstack/react-query'

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
