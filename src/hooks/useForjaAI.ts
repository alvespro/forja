import { useMutation } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'

import { MAX_AI_QUESTION, type ForjaAgente } from '@/lib/forja-agents'
import { supabase } from '@/lib/supabase'

export { FORJA_AGENTES, type ForjaAgente } from '@/lib/forja-agents'

export type PerguntarInput = {
  agente: ForjaAgente
  pergunta: string
}

async function perguntarAgente({ agente, pergunta }: PerguntarInput, historico: boolean) {
  if (!pergunta.trim() || pergunta.length > MAX_AI_QUESTION) {
    throw new Error('Escreva uma pergunta de até 6.000 caracteres.')
  }
  const { data, error } = await supabase.functions.invoke<{ resposta?: string; error?: string }>('forja-ai', {
    body: { agente, pergunta: pergunta.trim(), historico },
  })
      if (error) {
        if (error instanceof FunctionsHttpError) {
          if (error.context.status === 401) throw new Error('Sua sessão expirou. Entre novamente para conversar.')
          if (error.context.status === 429) throw new Error('O agente está ocupado. Aguarde um momento e tente novamente.')
          let serverMessage: string | undefined
          try {
            const body = await error.context.clone().json()
            serverMessage = body?.error
          } catch {
            // corpo não era JSON com `error` — segue com a mensagem genérica
          }
          if (serverMessage && error.context.status < 500) throw new Error(serverMessage)
        }
        throw new Error('Não foi possível obter a resposta. Confira a conexão e tente novamente.')
      }
      if (!data?.resposta) throw new Error(data?.error ?? 'Resposta vazia do agente')
      return data.resposta
}

/** Análises pontuais das telas não entram no histórico do chat. */
export function useForjaAI() {
  return useMutation({
    retry: false,
    meta: { errorMessage: 'O agente não respondeu' },
    mutationFn: (input: PerguntarInput) => perguntarAgente(input, false),
  })
}

export function useForjaChatAI() {
  return useMutation({ retry: false, mutationFn: (input: PerguntarInput) => perguntarAgente(input, true) })
}
