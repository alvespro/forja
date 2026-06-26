import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { KeyResult } from '@/types/database'

import { useAuth } from './use-auth'

export function useKeyResults() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['key-results'],
    queryFn: async () => {
      const { data, error } = await supabase.from('key_results').select('*')
      if (error) throw error
      return data as KeyResult[]
    },
    enabled: !!user,
  })
}

/** Agrupa os resultados-chave por meta, para cálculo de progresso e exibição. */
export function groupKeyResultsByGoal(keyResults: KeyResult[] | undefined): Map<string, KeyResult[]> {
  const map = new Map<string, KeyResult[]>()
  if (!keyResults) return map

  for (const kr of keyResults) {
    const list = map.get(kr.goal_id) ?? []
    list.push(kr)
    map.set(kr.goal_id, list)
  }

  return map
}

export type KeyResultInput = {
  goal_id: string
  descricao: string
  valor_meta: number
  valor_atual: number
  unidade: string | null
}

export function useCreateKeyResult() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: KeyResultInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('key_results').insert({ ...values, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['key-results'] }),
  })
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, valor_atual }: { id: string; valor_atual: number }) => {
      const { error } = await supabase.from('key_results').update({ valor_atual }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['key-results'] }),
  })
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('key_results').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['key-results'] }),
  })
}
