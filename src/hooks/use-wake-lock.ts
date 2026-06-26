import { useEffect, useRef } from 'react'

/** Seção 6.4 do SPEC: mantém a tela acesa durante a sessão de treino. */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let cancelled = false

    async function requestLock() {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        lockRef.current = lock
      } catch {
        // Permissão negada ou indisponível; segue sem wake lock.
      }
    }

    requestLock()

    function handleVisibility() {
      if (document.visibilityState === 'visible' && !lockRef.current) {
        requestLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
