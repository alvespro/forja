import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'

import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

export type YazioSyncLog = {
  id: string
  data: string
  status: 'sucesso' | 'erro'
  registros_importados: number
  erro: string | null
  created_at: string
}

export function useLastYazioSync() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['yazio-sync-logs', 'last'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yazio_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as YazioSyncLog | null
    },
    enabled: !!user,
  })
}

export function useSyncYazioNow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        status?: string
        registros_importados?: number
        error?: string
      }>('sync-yazio', { body: {} })

      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.clone().json()
            if (body?.error) throw new Error(body.error)
          } catch {
            // corpo não era JSON com `error` — segue com a mensagem genérica
          }
        }
        throw error
      }
      if (data?.status !== 'sucesso') throw new Error(data?.error ?? 'Falha ao sincronizar com o Yazio')
      return data
    },
    // onSettled (não onSuccess): mesmo quando a sincronização falha, a Edge Function já gravou um
    // novo log de erro no banco — sem isso o rodapé fica preso mostrando o último sync que deu certo,
    // escondendo a falha mais recente.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      queryClient.invalidateQueries({ queryKey: ['yazio-sync-logs'] })
    },
  })
}
