import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { SupplementLog } from '@/types/database'

/** Todos os logs do usuário (usado pra calcular streak e % de adesão no ciclo). */
export function useSupplementLogs() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['supplement-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('supplement_logs').select('*').order('data', { ascending: false })
      if (error) throw error
      return data as SupplementLog[]
    },
    enabled: !!user,
  })
}

/** Marca/desmarca um suplemento como tomado hoje. Upsert por (supplement_id, data) — constraint única já existe. */
export function useToggleSupplementLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ supplementId, tomado }: { supplementId: string; tomado: boolean }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase.from('supplement_logs').upsert(
        {
          user_id: user.id,
          supplement_id: supplementId,
          data: todayInSaoPaulo(),
          tomado,
          horario: new Date().toTimeString().slice(0, 8),
        },
        { onConflict: 'supplement_id,data' },
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplement-logs'] }),
  })
}
