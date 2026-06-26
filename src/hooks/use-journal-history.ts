import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { JournalEntry } from '@/types/database'

import { useAuth } from './use-auth'

const HISTORY_LIMIT = 14

/** Últimas entradas de diário (tipo='diario'), mais recentes primeiro. */
export function useJournalHistory() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['journal-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('tipo', 'diario')
        .order('data', { ascending: false })
        .limit(HISTORY_LIMIT)
      if (error) throw error
      return data as JournalEntry[]
    },
    enabled: !!user,
  })
}
