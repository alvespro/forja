import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { ProtocolLog } from '@/types/database'

export function useProtocolLogs(protocolId?: string, limit = 90) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['protocol-logs', protocolId, limit],
    queryFn: async () => {
      const q = supabase
        .from('protocol_logs')
        .select('*')
        .order('data_aplicacao', { ascending: false })
        .limit(limit)
      if (protocolId) q.eq('protocol_id', protocolId)
      const { data, error } = await q
      if (error) throw error
      return data as ProtocolLog[]
    },
    enabled: !!user && !!protocolId,
  })
}

export type ProtocolLogInput = {
  protocol_id: string
  compound_id?: string | null
  data_aplicacao?: string
  dose_aplicada_mg?: number | null
  local_aplicacao?: string | null
  humor?: number | null
  energia?: number | null
  libido?: number | null
  efeitos_percebidos?: string | null
  observacoes?: string | null
}

export function useCreateProtocolLog() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProtocolLogInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('protocol_logs').insert({
        ...values,
        user_id: user.id,
        // Timestamp real: data pura vira 00:00 UTC, que é o dia anterior em São Paulo.
        data_aplicacao: values.data_aplicacao ?? new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocol-logs'] }),
  })
}

export type RegistroAplicacaoInput = {
  protocol_id: string
  /** Data agendada em YYYY-MM-DD. Sem ela, registra o instante atual. */
  data_aplicacao?: string
  compostos: { compound_id: string; dose_aplicada_mg: number | null }[]
  local_aplicacao: string
  observacoes: string | null
  humor: number
  energia: number
  libido: number
}

/** "✓ Confirmar aplicação": um protocol_log por composto aplicado, todos com o mesmo horário. */
export function useRegistrarAplicacao() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ compostos, data_aplicacao, ...comum }: RegistroAplicacaoInput) => {
      if (!user) throw new Error('Não autenticado')
      if (compostos.length === 0) throw new Error('Nenhum composto selecionado')
      // Datas puras em UTC viram o dia anterior em São Paulo. O meio-dia local
      // preserva a data agendada ao normalizar o histórico do ciclo.
      const dataAplicacao = data_aplicacao ? `${data_aplicacao}T12:00:00-03:00` : new Date().toISOString()
      const { error } = await supabase
        .from('protocol_logs')
        .insert(compostos.map((c) => ({ ...comum, ...c, user_id: user.id, data_aplicacao: dataAplicacao })))
      if (error) throw error

      // O lembrete diário é uma notificação persistida. Sem esta atualização o
      // registro entrava no histórico, mas o alerta "Dia de aplicação" seguia
      // visível até o usuário dispensá-lo manualmente.
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ lida: true })
        .eq('user_id', user.id)
        .in('dedupe_key', [
          `aplicacao_${comum.protocol_id}_${data_aplicacao ?? todayInSaoPaulo()}`,
          `aplicacao_perdida_${comum.protocol_id}_${data_aplicacao ?? todayInSaoPaulo()}`,
        ])
        .eq('lida', false)
      if (notificationError) console.warn('Não foi possível encerrar o lembrete da aplicação.', notificationError)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protocol-logs'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
