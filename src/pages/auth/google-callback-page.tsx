import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { calendar_api } from '@/hooks/use-calendar'
import { useAuth } from '@/hooks/use-auth'
// OAuth codes são de uso único; compartilhar a promise tolera StrictMode.
const exchanges = new Map<string, Promise<unknown>>()
export function GoogleCallbackPage() {
  const { user } = useAuth()
  const navigate = useNavigate(), qc = useQueryClient()
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) return
    let active = true
    const p = new URLSearchParams(window.location.search)
    const code = p.get('code'), state = p.get('state')
    if (p.get('error') || !code || !state || state !== sessionStorage.getItem('forja-google-state')) { setError('Conexão cancelada ou expirada. Inicie novamente nas configurações.'); return }
    const key = user.id + ':' + state
    let exchange = exchanges.get(key)
    if (!exchange) { exchange = calendar_api('auth_callback', { code, state }); exchanges.set(key, exchange) }
    exchange.then(async () => {
      if (!active) return
      sessionStorage.removeItem('forja-google-state')
      await qc.invalidateQueries({ queryKey: ['google-status'] })
      navigate('/agenda', { replace: true })
      void calendar_api('sync').then(() => qc.invalidateQueries({ queryKey: ['calendar-events'] })).catch(() => undefined)
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [user, navigate, qc])
  return <main className="mx-auto max-w-lg p-8"><h1 className="mb-4 text-xl">Conectando Google Calendar</h1>{error ? <><p role="alert">{error}</p><Link className="mt-4 block underline" to="/configuracoes">Voltar às configurações</Link></> : <p role="status">Finalizando autorização…</p>}</main>
}
