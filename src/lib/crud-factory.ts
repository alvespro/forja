import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

type CrudConfig = {
  /** Nome da tabela no Postgres. */
  table: string
  /** Prefixo da query key do TanStack Query (também usado para invalidação). */
  queryKey: string
  /** Ordenação padrão da listagem. */
  orderBy?: { column: string; ascending?: boolean }
}

/**
 * Gera hooks de CRUD (useList/useCreate/useUpdate/useDelete) para uma tabela Supabase
 * cujo `user_id` é preenchido automaticamente na criação e cuja invalidação de cache
 * é só `[queryKey]`. Tabelas com filtros de listagem ou invalidação mais específica
 * (ex: por `session_id`) devem manter hooks próprios — esta factory cobre o caso simples,
 * que é a maioria.
 */
export function createCrudHooks<Row, Insert extends Record<string, unknown>, Update = Partial<Insert>>(
  config: CrudConfig,
) {
  const { table, queryKey, orderBy } = config

  function useList() {
    const { user } = useAuth()

    return useQuery({
      queryKey: [queryKey],
      queryFn: async () => {
        let query = supabase.from(table).select('*')
        if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
        const { data, error } = await query
        if (error) throw error
        return data as Row[]
      },
      enabled: !!user,
    })
  }

  function useCreate() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (values: Insert) => {
        if (!user) throw new Error('Usuário não autenticado')
        const { error } = await supabase.from(table).insert({ ...values, user_id: user.id })
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async ({ id, values }: { id: string; values: Update }) => {
        const { error } = await supabase
          .from(table)
          .update(values as Record<string, unknown>)
          .eq('id', id)
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    })
  }

  function useDelete() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    })
  }

  return { useList, useCreate, useUpdate, useDelete }
}
