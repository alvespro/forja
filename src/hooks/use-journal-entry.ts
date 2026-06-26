import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { JournalEntry } from '@/types/database'

import { useAuth } from './use-auth'

export type JournalEntryType = 'diario' | 'semanal'

export type SaveJournalEntryInput = {
  humor: number | null
  o_que_senti: string
}

/** Entrada de diário/revisão para uma data e tipo específicos (Seção 5.1). */
export function useJournalEntry(date: string, tipo: JournalEntryType) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['journal-entry', tipo, date]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('data', date)
        .eq('tipo', tipo)
        .maybeSingle()
      if (error) throw error
      return data as JournalEntry | null
    },
    enabled: !!user,
  })

  const save = useMutation({
    mutationFn: async (values: SaveJournalEntryInput) => {
      if (!user) throw new Error('Usuário não autenticado')

      if (query.data?.id) {
        const { error } = await supabase.from('journal_entries').update(values).eq('id', query.data.id)
        if (error) throw error
        return
      }

      const { error } = await supabase.from('journal_entries').insert({
        ...values,
        user_id: user.id,
        data: date,
        tipo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { ...query, save }
}
