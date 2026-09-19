import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { CATEGORIES, type CalendarEvent, type EventInput } from '@/lib/calendar'

export async function calendar_api<T = Record<string, unknown>>(acao: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('google-calendar-sync', { body: { acao, ...params } })
  if (error) {
    let message = error.message
    if (error.context instanceof Response) { const body = await error.context.json().catch(() => null); message = body?.error ?? message }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}
export function useCalendarEvents() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['calendar-events', user?.id], enabled: !!user, queryFn: async () => {
    const all: CalendarEvent[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', user!.id).is('deleted_at', null).order('inicio').order('id').range(offset, offset + 999)
      if (error) throw error
      all.push(...data.map(e => ({ ...e, categoria: e.categoria in CATEGORIES ? e.categoria : 'pessoal', fim: e.fim ?? new Date(Date.parse(e.inicio) + 3600000).toISOString(), descricao: e.descricao ?? '', local: e.local ?? '' })) as CalendarEvent[])
      if (data.length < 1000) return all
    }
  } })
}
export type GoogleStatus = { conectado: boolean; last_synced_at: string | null; client_id: string | null }
export function useGoogleStatus() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['google-status', user?.id], enabled: !!user, queryFn: () => calendar_api<GoogleStatus>('status') })
}
export function useCalendarSync() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => calendar_api<{ sincronizados: number; criados_google: number; pendente?: boolean }>('sync'),
    onSuccess: r => { toast[r.pendente ? 'info' : 'success'](r.pendente ? 'Sincronização pendente. Conecte o Google ou tente novamente em instantes.' : `${r.sincronizados} eventos recebidos; ${r.criados_google} enviados.`) },
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['calendar-events'] }); void qc.invalidateQueries({ queryKey: ['google-status'] }) },
  })
}
export function useSaveCalendarEvent() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = ['calendar-events', user?.id]
  return useMutation({ retry: false,
    mutationFn: (input: EventInput & { acao: 'criar_evento' | 'atualizar_evento' | 'deletar_evento' }) => calendar_api<{ evento: CalendarEvent; warning?: string | null }>(input.acao, input),
    onMutate: async input => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<CalendarEvent[]>(key)
      qc.setQueryData<CalendarEvent[]>(key, old => {
        const rest = (old ?? []).filter(e => e.id !== input.id)
        return input.acao === 'deletar_evento' ? rest : [...rest, { ...input, id: input.id!, user_id: user!.id, sincronizado: false, criado_no_forja: true, updated_at: new Date().toISOString(), google_event_id: null, google_html_link: null }]
      })
      return { previous }
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) qc.setQueryData(key, ctx.previous); else qc.removeQueries({ queryKey: key, exact: true }) },
    onSuccess: result => {
      if (result.warning) toast.warning('Salvo no FORJA. ' + result.warning)
      else toast.success(result.evento.sincronizado ? 'Agenda salva e sincronizada.' : 'Salvo no FORJA. Conecte o Google ou sincronize para enviar.')
      void qc.invalidateQueries({ queryKey: ['google-status'] })
      void qc.invalidateQueries({ queryKey: ['crm-clients'] })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
