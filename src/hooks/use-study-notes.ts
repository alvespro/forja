import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  buscarNotasLocais,
  listarNotasLocais,
  marcarNotaExcluida,
  obterNotaLocal,
  salvarNotaLocal,
  sincronizarNotas,
} from '@/lib/offline-study-notes'
import type { StudyNote, StudyNoteFonteTipo } from '@/types/database'

import { useAuth } from './use-auth'

const KEY = 'study-notes'
export type StudyNoteInput = {
  titulo: string
  conteudo?: string | null
  tags?: string[] | null
  fonte_tipo?: StudyNoteFonteTipo | null
  fonte_id?: string | null
  favorito?: boolean
}

/** Sincroniza ao abrir Estudos, reconectar ou retornar ao app. */
function useSincronizacaoDeNotas() {
  const { user } = useAuth()
  const qc = useQueryClient()
  useEffect(() => {
    if (!user) return
    const sincronizar = async () => {
      await sincronizarNotas(user.id)
      await qc.invalidateQueries({ queryKey: [KEY] })
    }
    void sincronizar()
    window.addEventListener('online', sincronizar)
    window.addEventListener('focus', sincronizar)
    return () => {
      window.removeEventListener('online', sincronizar)
      window.removeEventListener('focus', sincronizar)
    }
  }, [qc, user])
}

/**
 * Anotações, com busca full-text (coluna gerada `busca`, português sem acento).
 * Sem termo: todas, mais recentes primeiro.
 */
export function useStudyNotes(busca = '') {
  const { user } = useAuth()
  const termo = busca.trim()
  useSincronizacaoDeNotas()
  return useQuery({
    queryKey: [KEY, 'lista', termo],
    queryFn: async () => {
      const notas = await listarNotasLocais(user!.id)
      return buscarNotasLocais(notas, termo)
    },
    enabled: !!user,
    placeholderData: (anterior) => anterior,
  })
}

export function useStudyNote(id: string | undefined) {
  const { user } = useAuth()
  useSincronizacaoDeNotas()
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      return obterNotaLocal(user!.id, id!)
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
      const local = await salvarNotaLocal(user.id, id, {
        titulo: values.titulo,
        conteudo: values.conteudo ?? null,
        tags: values.tags ?? null,
        fonte_tipo: values.fonte_tipo ?? null,
        fonte_id: values.fonte_id ?? null,
        favorito: values.favorito ?? false,
      })
      // A nota já está salva no aparelho; a tentativa remota nunca bloqueia a edição offline.
      void sincronizarNotas(user.id).then(() => qc.invalidateQueries({ queryKey: [KEY] }))
      return local
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useAlternarFavorito() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, favorito }: { id: string; favorito: boolean }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const nota = await obterNotaLocal(user.id, id)
      if (!nota) throw new Error('Anotação não encontrada no dispositivo')
      await salvarNotaLocal(user.id, id, { ...nota, favorito })
      void sincronizarNotas(user.id).then(() => qc.invalidateQueries({ queryKey: [KEY] }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useExcluirNota() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado')
      await marcarNotaExcluida(user.id, id)
      void sincronizarNotas(user.id).then(() => qc.invalidateQueries({ queryKey: [KEY] }))
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
