import { useEffect, useState } from 'react'

import type { ForjaAgente } from '@/hooks/useForjaAI'

export type ForjaChatLaunchRequest = {
  agente: ForjaAgente
  pergunta?: string
}

// Store mínimo (sem libs externas) para permitir que qualquer tela abra o ForjaChat já
// pré-selecionado num agente + pergunta — o botão fica no App.tsx, fora da árvore das páginas.
let listeners: Array<(request: ForjaChatLaunchRequest) => void> = []

export function launchForjaChat(request: ForjaChatLaunchRequest) {
  listeners.forEach((listener) => listener(request))
}

export function useForjaChatLaunchRequest(): ForjaChatLaunchRequest | null {
  const [request, setRequest] = useState<ForjaChatLaunchRequest | null>(null)

  useEffect(() => {
    listeners.push(setRequest)
    return () => {
      listeners = listeners.filter((listener) => listener !== setRequest)
    }
  }, [])

  return request
}
