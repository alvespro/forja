import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { StudyNote, StudyNoteFonteTipo } from '@/types/database'

import { useAuth } from './use-auth'

const KEY = 'study-notes'
const COLUNAS = 'id, user_id, titulo, conteudo, tags, fonte_tipo, fonte_id, favorito, created_at, updated_at'

export type StudyNoteInput = {
  titulo: string
  conteudo?: string | null
  tags?: string[] | null
  fonte_tipo?: StudyNoteFonteTipo | null
  fonte_id?: string | null
  favorito?: boolean
}

/**
 * Anotações, com busca full-text (coluna gerada `busca`, português sem acento).
 * Sem termo: todas, mais recentes primeiro.
 */
export function useStudyNotes(busca = '') {
  const { user } = useAuth()
  const termo = busca.trim()
  return useQuery({
    queryKey: [KEY, 'lista', termo],
    queryFn: async () => {
      let q = supabase.from('study_notes').select(COLUNAS).order('updated_at', { ascending: false })
      if (termo) q = q.textSearch('busca', termo, { type: 'websearch', config: 'portuguese' })
      const { data, error } = await q
      if (error) throw error
      return data as StudyNote[]
    },
    enabled: !!user,
    placeholderData: (anterior) => anterior,
  })
}

export function useStudyNote(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase.from('study_notes').select(COLUNAS).eq('id', id!).single()
      if (error) throw error
      return data as StudyNote
    },
    enabled: !!user && !!id,
  })
}

export function useSalvarNota() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: StudyNoteInput }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const agora = new Date().toISOString()
      if (id) {
        const { data, error } = await supabase
          .from('study_notes')
          .update({ ...values, updated_at: agora })
          .eq('id', id)
          .select(COLUNAS)
          .single()
        if (error) throw error
        return data as StudyNote
      }
      const { data, error } = await supabase
        .from('study_notes')
        .insert({ ...values, user_id: user.id })
        .select(COLUNAS)
        .single()
      if (error) throw error
      return data as StudyNote
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useAlternarFavorito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, favorito }: { id: string; favorito: boolean }) => {
      const { error } = await supabase.from('study_notes').update({ favorito }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useExcluirNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('study_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

/** Todas as tags já usadas (para o autocomplete), em ordem alfabética. */
export function tagsExistentes(notas: StudyNote[] | undefined): string[] {
  const set = new Set<string>()
  for (const n of notas ?? []) for (const t of n.tags ?? []) if (t.trim()) set.add(t.trim())
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
