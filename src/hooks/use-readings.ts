import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { LibraryStatus, Reading } from '@/types/database'

import { useAuth } from './use-auth'

const SEM_TRILHA = 'Sem trilha'

export function useReadings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['readings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .order('trilha', { ascending: true, nullsFirst: false })
        .order('titulo', { ascending: true })
      if (error) throw error
      return data as Reading[]
    },
    enabled: !!user,
  })
}

/** Agrupa as leituras por trilha, em ordem alfabética (sem trilha vai por último). */
export function groupReadingsByTrilha(readings: Reading[] | undefined): Map<string, Reading[]> {
  const map = new Map<string, Reading[]>()
  if (!readings) return map

  for (const reading of readings) {
    const key = reading.trilha?.trim() || SEM_TRILHA
    const list = map.get(key) ?? []
    list.push(reading)
    map.set(key, list)
  }

  return map
}

export type ReadingInput = {
  trilha: string | null
  titulo: string
  autor: string | null
  status: LibraryStatus
  progresso: number
  nota_321: string | null
}

export function useCreateReading() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ReadingInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('readings').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  })
}

export function useUpdateReading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ReadingInput> }) => {
      const { error } = await supabase.from('readings').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  })
}

export function useDeleteReading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('readings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  })
}
