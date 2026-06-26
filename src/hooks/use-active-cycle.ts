import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Cycle } from '@/types/database'

import { useAuth } from './use-auth'

export function useActiveCycle() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['active-cycle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Cycle | null
    },
    enabled: !!user,
  })
}
