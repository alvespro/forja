import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Cycle } from '@/types/database'

import { useAuth } from './use-auth'

export function useCycles() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('data_inicio', { ascending: false })
      if (error) throw error
      return data as Cycle[]
    },
    enabled: !!user,
  })
}
