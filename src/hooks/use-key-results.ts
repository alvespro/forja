import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCrudHooks } from '@/lib/crud-factory'
import { supabase } from '@/lib/supabase'
import type { KeyResult } from '@/types/database'

export type KeyResultInput = {
  goal_id: string
  descricao: string
  valor_meta: number
  valor_atual: number
  unidade: string | null
}

const keyResultsCrud = createCrudHooks<KeyResult, KeyResultInput>({
  table: 'key_results',
  queryKey: 'key-results',
})

export const useKeyResults = keyResultsCrud.useList
export const useCreateKeyResult = keyResultsCrud.useCreate
export const useDeleteKeyResult = keyResultsCrud.useDelete

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

/** Atualiza só o valor atual de um resultado-chave (uso frequente, payload mínimo). */
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
