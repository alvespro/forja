import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { todayInSaoPaulo } from '@/lib/date'
import { agendarRevisao, type Avaliacao } from '@/lib/flashcards'
import { supabase } from '@/lib/supabase'
import type { Flashcard, FlashcardDeck, FlashcardFonteTipo } from '@/types/database'

import { useAuth } from './use-auth'

const KEY_CARDS = 'flashcards'
const KEY_DECKS = 'flashcard-decks'

export type FlashcardInput = {
  deck_id?: string | null
  frente: string
  verso: string
  fonte?: string | null
  fonte_id?: string | null
  fonte_tipo?: FlashcardFonteTipo | null
}

export type DeckInput = Pick<FlashcardDeck, 'nome'> & Partial<Pick<FlashcardDeck, 'descricao' | 'categoria' | 'cor'>>

export function useFlashcardDecks() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY_DECKS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as FlashcardDeck[]
    },
    enabled: !!user,
  })
}

/** Todos os cards (uso pessoal: poucas centenas — contagens por deck saem daqui). */
export function useFlashcards() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY_CARDS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('proxima_revisao', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Flashcard[]
    },
    enabled: !!user,
  })
}

/** Só os cards devidos hoje (proxima_revisao <= hoje) — usado no card do Hoje. */
export function useFlashcardsDevidos() {
  const { user } = useAuth()
  const hoje = todayInSaoPaulo()
  return useQuery({
    queryKey: [KEY_CARDS, 'devidos', hoje],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .lte('proxima_revisao', hoje)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!user,
  })
}

/** Cards criados a partir de uma origem (livro, curso ou anotação). */
export function useFlashcardsDaFonte(tipo: FlashcardFonteTipo, fonteId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY_CARDS, 'fonte', tipo, fonteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('fonte_tipo', tipo)
        .eq('fonte_id', fonteId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Flashcard[]
    },
    enabled: !!user && !!fonteId,
  })
}

function invalidarCards(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: [KEY_CARDS] })
}

export function useCriarFlashcards() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cards: FlashcardInput[]) => {
      if (!user) throw new Error('Usuário não autenticado')
      if (cards.length === 0) return
      const hoje = todayInSaoPaulo()
      const { error } = await supabase
        .from('flashcards')
        .insert(cards.map((c) => ({ ...c, user_id: user.id, proxima_revisao: hoje })))
      if (error) throw error
    },
    onSuccess: () => invalidarCards(qc),
  })
}

export function useAtualizarFlashcard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<FlashcardInput> }) => {
      const { error } = await supabase.from('flashcards').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidarCards(qc),
  })
}

export function useExcluirFlashcard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flashcards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidarCards(qc),
  })
}

/** Grava a avaliação da revisão. Não invalida a lista: a sessão usa uma fila fixa. */
export function useAvaliarFlashcard() {
  return useMutation({
    mutationFn: async ({ card, avaliacao }: { card: Flashcard; avaliacao: Avaliacao }) => {
      const proxima = agendarRevisao(card, avaliacao, todayInSaoPaulo())
      const { error } = await supabase.from('flashcards').update(proxima).eq('id', card.id)
      if (error) throw error
      return proxima
    },
  })
}

export function useCriarDeck() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: DeckInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({ ...values, user_id: user.id })
        .select('*')
        .single()
      if (error) throw error
      return data as FlashcardDeck
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY_DECKS] }),
  })
}

export function useAtualizarDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<DeckInput> }) => {
      const { error } = await supabase.from('flashcard_decks').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY_DECKS] }),
  })
}

/** Arquiva o deck (ativo=false); os cards ficam sem deck em vez de serem apagados. */
export function useArquivarDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: e1 } = await supabase.from('flashcards').update({ deck_id: null }).eq('deck_id', id)
      if (e1) throw e1
      const { error } = await supabase.from('flashcard_decks').update({ ativo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY_DECKS] })
      invalidarCards(qc)
    },
  })
}
