import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { LibraryStatus, Reading } from '@/types/database'

import { useAuth } from './use-auth'

const SEM_TRILHA = 'Sem trilha'

export type ReadingInput = {
  trilha?: string | null
  titulo: string
  autor?: string | null
  status?: LibraryStatus
  progresso?: number | null
  nota_321?: string | null
  dev_area_id?: string | null
  habilidades_desenvolvidas?: string[] | null
  aprendizado_1?: string | null
  aprendizado_2?: string | null
  aprendizado_3?: string | null
  aplicacao_1?: string | null
  aplicacao_2?: string | null
  acao_1?: string | null
  citacao_favorita?: string | null
  nota_geral?: number | null
  data_inicio?: string | null
  data_conclusao?: string | null
  resumo?: string | null
}

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

export function useReading(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['readings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Reading
    },
    enabled: !!user && !!id,
  })
}

export function useCreateReading() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ReadingInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('readings').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readings'] }),
  })
}

export function useUpdateReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ReadingInput> }) => {
      const { error } = await supabase.from('readings').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['readings'] })
      qc.invalidateQueries({ queryKey: ['readings', id] })
    },
  })
}

export function useDeleteReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('readings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readings'] }),
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
