import { useMutation } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

export type ForjaAgente = 'treino' | 'biblioteca' | 'coach' | 'nutricao'

export const FORJA_AGENTES: { value: ForjaAgente; label: string }[] = [
  { value: 'treino', label: 'Treino' },
  { value: 'biblioteca', label: 'Biblioteca' },
  { value: 'coach', label: 'Coach' },
  { value: 'nutricao', label: 'Nutrição' },
]

type PerguntarInput = {
  agente: ForjaAgente
  pergunta: string
}

export function useForjaAI() {
  return useMutation({
    mutationFn: async ({ agente, pergunta }: PerguntarInput) => {
      const { data, error } = await supabase.functions.invoke<{ resposta?: string; error?: string }>(
        'forja-ai',
        { body: { agente, pergunta } },
      )
      if (error) throw error
      if (!data?.resposta) throw new Error(data?.error ?? 'Resposta vazia do agente')
      return data.resposta
    },
  })
}
