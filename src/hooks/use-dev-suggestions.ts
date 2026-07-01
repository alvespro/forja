import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { DevSuggestion, DevSuggestionStatus } from '@/types/database'

import { useAuth } from './use-auth'

export function useDevSuggestions(semana?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dev-suggestions', semana ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('dev_suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      if (semana) q = q.eq('semana_sugestao', semana)

      const { data, error } = await q
      if (error) throw error
      return data as DevSuggestion[]
    },
    enabled: !!user,
  })
}

export function useUpdateDevSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DevSuggestionStatus }) => {
      const { error } = await supabase.from('dev_suggestions').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dev-suggestions'] })
    },
  })
}
