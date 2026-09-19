import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { EpubAnotacao, EpubBook, EpubDestaque } from '@/types/database'

import { useAuth } from './use-auth'

const KEY = 'epub-library'
const BUCKET = 'epubs'
export const EPUB_MAX_BYTES = 50 * 1024 * 1024
/** URLs assinadas das capas/arquivos (bucket privado) valem 1 hora. */
const URL_TTL_S = 60 * 60

export function useEpubLibrary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from('epub_library').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      return data as EpubBook[]
    },
    enabled: !!user,
  })
}

export function useEpubBook(id: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase.from('epub_library').select('*').eq('id', id!).single()
      if (error) throw error
      return data as EpubBook
    },
    enabled: !!user && !!id,
  })
}

/** URLs assinadas das capas (bucket privado), por caminho. */
export function useCapasAssinadas(caminhos: string[]) {
  const { user } = useAuth()
  const chave = [...caminhos].sort().join('|')
  return useQuery({
    queryKey: [KEY, 'capas', chave],
    queryFn: async () => {
      if (caminhos.length === 0) return {} as Record<string, string>
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, URL_TTL_S)
      if (error) throw error
      return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl]))
    },
    enabled: !!user,
    staleTime: (URL_TTL_S - 300) * 1000,
  })
}

/** Baixa o .epub do bucket privado como ArrayBuffer (o epub.js abre direto dele). */
export async function baixarEpub(caminho: string): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(caminho)
  if (error) throw error
  return data.arrayBuffer()
}

export type ImportarEpubInput = { arquivo: File; titulo: string; autor: string | null; capa: Blob | null }

export function useImportarEpub() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ arquivo, titulo, autor, capa }: ImportarEpubInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      if (arquivo.size > EPUB_MAX_BYTES) throw new Error('O arquivo passa de 50 MB.')
      const base = `${user.id}/${crypto.randomUUID()}`
      const caminhoEpub = `${base}.epub`
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(caminhoEpub, arquivo, { contentType: 'application/epub+zip' })
      if (upErr) throw upErr

      let caminhoCapa: string | null = null
      if (capa) {
        const tipo = capa.type || 'image/jpeg'
        const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg'
        const { error: capaErr } = await supabase.storage.from(BUCKET).upload(`${base}-capa.${ext}`, capa, { contentType: tipo })
        if (!capaErr) caminhoCapa = `${base}-capa.${ext}`
      }

      const { data, error } = await supabase
        .from('epub_library')
        .insert({ user_id: user.id, titulo, autor, arquivo_url: caminhoEpub, capa_url: caminhoCapa })
        .select('*')
        .single()
      if (error) {
        // Não deixa arquivo órfão no bucket se o registro falhar.
        await supabase.storage.from(BUCKET).remove([caminhoEpub, ...(caminhoCapa ? [caminhoCapa] : [])])
        throw error
      }
      return data as EpubBook
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export type EpubPatch = Partial<{
  ultima_posicao: string
  progresso_pct: number
  destaques: EpubDestaque[]
  anotacoes: EpubAnotacao[]
}>

/** Salva posição/destaques/anotações. Atualiza o cache sem refetch (virar página é frequente). */
export function useAtualizarEpub() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EpubPatch }) => {
      const { error } = await supabase
        .from('epub_library')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { id, values }) => {
      qc.setQueryData<EpubBook>([KEY, id], (antigo) => (antigo ? { ...antigo, ...values } : antigo))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [KEY], exact: true }),
  })
}

export function useExcluirEpub() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (livro: EpubBook) => {
      const { error } = await supabase.from('epub_library').delete().eq('id', livro.id)
      if (error) throw error
      const arquivos = [livro.arquivo_url, livro.capa_url].filter((c): c is string => !!c)
      if (arquivos.length) await supabase.storage.from(BUCKET).remove(arquivos)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
