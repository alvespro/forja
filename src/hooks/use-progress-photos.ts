import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'

import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { ProgressPhoto, ProgressPhotoTipo } from '@/types/database'

import { useAuth } from './use-auth'

const BUCKET = 'progress-photos'

/** Fotos de progresso com URL assinada (1h) para exibição, mais recentes primeiro. */
export function useProgressPhotos() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['progress-photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error

      const photos = data as ProgressPhoto[]
      if (photos.length === 0) return photos

      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(photos.map((p) => p.storage_path), 3600)
      if (signError) throw signError

      return photos.map((p, i) => ({ ...p, signed_url: signed?.[i]?.signedUrl ?? undefined }))
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // URLs valem 1h; meia hora de cache é seguro
  })
}

export type UploadPhotoInput = {
  file: File
  tipo: ProgressPhotoTipo
  notas?: string
  peso_kg?: number | null
}

/** Sobe a imagem para o bucket e cria o registro. Retorna a linha criada. */
export function useUploadProgressPhoto() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    meta: { errorMessage: 'Não foi possível enviar a foto' },
    mutationFn: async ({ file, tipo, notas, peso_kg }: UploadPhotoInput) => {
      if (!user) throw new Error('Não autenticado')
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        throw new Error('Formato não suportado — use JPG, PNG ou WebP.')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Imagem acima de 10MB — reduza antes de enviar.')
      }

      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          data: todayInSaoPaulo(),
          storage_path: path,
          tipo,
          notas: notas?.trim() || null,
          peso_kg: peso_kg ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as ProgressPhoto
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-photos'] }),
  })
}

/** Gera o relatório de IA para uma foto (edge function analyze-progress-photo). */
export function useAnalyzeProgressPhoto() {
  const qc = useQueryClient()

  return useMutation({
    meta: { errorMessage: 'A análise da foto falhou' },
    mutationFn: async (photoId: string) => {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; relatorio?: string; error?: string }>(
        'analyze-progress-photo',
        { body: { photo_id: photoId } },
      )
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null)
          if (body?.error) throw new Error(body.error)
        }
        throw error
      }
      if (!data?.relatorio) throw new Error(data?.error ?? 'Análise vazia')
      return data.relatorio
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-photos'] }),
  })
}

/** Remove foto do bucket e o registro. */
export function useDeleteProgressPhoto() {
  const qc = useQueryClient()

  return useMutation({
    meta: { errorMessage: 'Não foi possível excluir a foto' },
    mutationFn: async (photo: ProgressPhoto) => {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path])
      if (storageError) throw storageError
      const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-photos'] }),
  })
}
