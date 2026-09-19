import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { SugestaoLivro } from '@/lib/flashcards'
import { supabase } from '@/lib/supabase'
import type { BookSuggestion } from '@/types/database'

import { useAuth } from './use-auth'

const KEY = 'book-suggestions'

export function useBookSuggestions() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_suggestions')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as BookSuggestion[]
    },
    enabled: !!user,
  })
}

/** Grava as sugestões da IA, pulando títulos que já estão pendentes. */
export function useSalvarSugestoesLivros() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sugestoes, pendentes }: { sugestoes: SugestaoLivro[]; pendentes: string[] }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const ja = new Set(pendentes.map((t) => t.toLowerCase()))
      const novas = sugestoes.filter((s) => !ja.has(s.titulo.toLowerCase()))
      if (novas.length === 0) return 0
      const { error } = await supabase.from('book_suggestions').insert(
        novas.map((s) => ({
          user_id: user.id,
          titulo: s.titulo,
          autor: s.autor ?? null,
          motivo: s.motivo ?? null,
          area: s.area ?? null,
          origem: 'ia',
        })),
      )
      if (error) throw error
      return novas.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

/** Adiciona à biblioteca (readings, "quero ler") e marca a sugestão como adicionada. */
export function useAdicionarSugestaoABiblioteca() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ origem, id, titulo, autor }: { origem: 'book' | 'dev'; id: string; titulo: string; autor: string | null }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('readings')
        .insert({ user_id: user.id, titulo, autor, status: 'quero_ler', progresso: 0 })
      if (error) throw error
      const tabela = origem === 'book' ? 'book_suggestions' : 'dev_suggestions'
      const { error: e2 } = await supabase.from(tabela).update({ status: 'adicionado' }).eq('id', id)
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['dev-suggestions'] })
      qc.invalidateQueries({ queryKey: ['readings'] })
    },
  })
}

export function useIgnorarSugestao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ origem, id }: { origem: 'book' | 'dev'; id: string }) => {
      const tabela = origem === 'book' ? 'book_suggestions' : 'dev_suggestions'
      const { error } = await supabase.from(tabela).update({ status: 'ignorado' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: ['dev-suggestions'] })
    },
  })
}
