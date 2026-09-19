import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { calendar_api, useCalendarSync, useGoogleStatus } from '@/hooks/use-calendar'
import { toast } from 'sonner'
export function GoogleCalendarCard() {
  const status = useGoogleStatus(), sync = useCalendarSync(), qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  async function connect() {
    setBusy(true)
    try {
      const redirect_uri = window.location.origin + '/auth/google/callback'
      const result = await calendar_api<{ state: string; client_id: string }>('auth_start', { redirect_uri })
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || result.client_id
      if (!client_id) throw new Error('Client ID Google não configurado.')
      sessionStorage.setItem('forja-google-state', result.state)
      window.location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id, redirect_uri, state: result.state, response_type: 'code', scope: 'https://www.googleapis.com/auth/calendar.events', access_type: 'offline', prompt: 'consent' }))
    } catch (e) { toast.error((e as Error).message); setBusy(false) }
  }
  async function disconnect() {
    setBusy(true)
    try { await calendar_api('desconectar'); await qc.invalidateQueries({ queryKey: ['google-status'] }); toast.success('Google desconectado. Seus eventos foram mantidos no FORJA.') }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return <section className="rounded-2xl border border-border bg-card/60 p-5"><h2 className="text-lg font-semibold">Google Calendar</h2>
    {status.isLoading ? <p role="status">Verificando conexão…</p> : status.isError ? <><p>Não foi possível verificar a integração.</p><Button variant="outline" onClick={() => status.refetch()}>Tentar novamente</Button></> : <>
      <p className="my-2 text-sm text-aco-texto">{status.data?.conectado ? 'Google Calendar conectado' : 'Conecte sua agenda para sincronizar compromissos nos dois sentidos.'}</p>
      {status.data?.last_synced_at && <p className="mb-3 text-xs text-aco-texto">Última sincronização: {new Date(status.data.last_synced_at).toLocaleString('pt-BR')}</p>}
      <div className="flex flex-wrap gap-2">{status.data?.conectado ? <><Button disabled={sync.isPending || busy} onClick={() => sync.mutate()}>Sincronizar agora</Button><Button variant="outline" disabled={busy || sync.isPending} onClick={disconnect}>Desconectar</Button></> : <Button disabled={busy} onClick={connect}>Conectar Google Calendar</Button>}</div>
    </>}
  </section>
}
