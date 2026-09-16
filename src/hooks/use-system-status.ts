import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { notifyManager, useQueryClient } from '@tanstack/react-query'

export type SystemStatus =
  | { estado: 'ok' }
  | { estado: 'falhas'; quantas: number }
  | { estado: 'offline' }

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/**
 * Estado real da barra de status do Hoje: offline (navigator.onLine) ou
 * quantas consultas estão em erro no cache do TanStack Query. Assim o
 * "ALL SYSTEMS OPERATIONAL" só aparece quando é verdade.
 */
export function useSystemStatus(): SystemStatus {
  const cache = useQueryClient().getQueryCache()
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  // O cache emite eventos no meio do render de outros componentes (useQuery novo = "added").
  // batchCalls adia a notificação, como o useIsFetching do TanStack; sem isso o React acusa
  // "Cannot update a component while rendering a different component".
  const falhas = useSyncExternalStore(
    useCallback((onChange: () => void) => cache.subscribe(notifyManager.batchCalls(onChange)), [cache]),
    () => cache.findAll({ predicate: (q) => q.state.status === 'error' }).length,
    () => 0,
  )

  if (!online) return { estado: 'offline' }
  if (falhas > 0) return { estado: 'falhas', quantas: falhas }
  return { estado: 'ok' }
}

/** Hora "HH:mm" em São Paulo, atualizada na virada de cada minuto. */
export function useClock(): string {
  const formatar = () =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date())
  const [hora, setHora] = useState(formatar)

  useEffect(() => {
    let intervalo: number | undefined
    const inicio = window.setTimeout(() => {
      setHora(formatar())
      intervalo = window.setInterval(() => setHora(formatar()), 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      window.clearTimeout(inicio)
      window.clearInterval(intervalo)
    }
  }, [])

  return hora
}
