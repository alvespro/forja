import { useState } from 'react'

const STORAGE_KEY = 'forja:active-workout-session'

/** Persiste a sessão de treino ativa no localStorage para sobreviver a um refresh/tela apagada. */
export function useActiveSession() {
  const [sessionId, setSessionIdState] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_KEY),
  )

  function setSessionId(id: string | null) {
    setSessionIdState(id)
    if (id) {
      window.localStorage.setItem(STORAGE_KEY, id)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { sessionId, setSessionId }
}
