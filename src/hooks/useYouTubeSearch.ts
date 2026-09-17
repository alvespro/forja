import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/types/database'

/**
 * Vídeos de execução via YouTube Data API v3 — fallback de mídia quando o
 * ExerciseDB não traz vídeo. Cada busca custa 100 unidades (10.000/dia), então
 * o cache é o próprio `exercises.youtube_video_id`: com ID salvo, nunca busca.
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

export const youtubeConfigurado = !!YOUTUBE_API_KEY

export interface YoutubeVideo {
  id: string
  titulo: string
  descricao: string
  thumbnail: string
  canal: string
  embedUrl: string
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }

/** O snippet vem com entidades HTML (&quot;, &#39;) — o app renderiza texto puro. */
export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ENTIDADES[e])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

export function lerResultadosYoutube(data: Json): YoutubeVideo[] {
  const itens: Json[] = Array.isArray(data?.items) ? data.items : []
  return itens.flatMap((item) => {
    const id = item?.id?.videoId
    if (typeof id !== 'string' || !VIDEO_ID.test(id)) return []
    const s = item.snippet ?? {}
    return [
      {
        id,
        titulo: decodificarEntidades(String(s.title ?? '')),
        descricao: decodificarEntidades(String(s.description ?? '')),
        thumbnail: s.thumbnails?.high?.url ?? s.thumbnails?.default?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        canal: decodificarEntidades(String(s.channelTitle ?? '')),
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      },
    ]
  })
}

/** Mensagem legível para as falhas do YouTube (cota, chave, API desativada). */
export function motivoErroYoutube(status: number, data: Json): string {
  const razao: string = data?.error?.errors?.[0]?.reason ?? ''
  if (razao === 'quotaExceeded' || razao === 'dailyLimitExceeded') return 'Cota diária do YouTube esgotada — tente amanhã.'
  if (razao === 'accessNotConfigured') return 'YouTube Data API v3 não está ativada no Google Cloud.'
  if (razao === 'keyInvalid' || status === 400) return 'Chave do YouTube inválida.'
  if (status === 403) return 'O YouTube recusou a busca (chave restrita a outro domínio?).'
  return 'YouTube indisponível agora.'
}

/** Como `searchExerciseVideos`, mas lança com o motivo — para a tela mostrar o erro. */
export async function buscarVideosYoutube(exerciseName: string, grupoMuscular?: string | null): Promise<YoutubeVideo[]> {
  if (!YOUTUBE_API_KEY) throw new Error('Adicione VITE_YOUTUBE_API_KEY no .env.local (e na Vercel).')

  // Português primeiro; o grupo só entra quando o nome sozinho é ambíguo (uma palavra).
  const nome = exerciseName.trim()
  const complemento = grupoMuscular && !nome.includes(' ') ? ` ${grupoMuscular}` : ''
  const params = new URLSearchParams({
    part: 'snippet',
    q: `${nome}${complemento} execução correta tutorial`,
    type: 'video',
    maxResults: '6',
    videoEmbeddable: 'true',
    videoDefinition: 'high',
    relevanceLanguage: 'pt',
    regionCode: 'BR',
    key: YOUTUBE_API_KEY,
  })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(motivoErroYoutube(response.status, data))
  return lerResultadosYoutube(data)
}

export async function searchExerciseVideos(exerciseName: string, grupoMuscular?: string | null): Promise<YoutubeVideo[]> {
  try {
    return await buscarVideosYoutube(exerciseName, grupoMuscular)
  } catch {
    return []
  }
}

/** Precisa de YouTube? Só sem vídeo próprio do ExerciseDB e sem ID já salvo (cache). */
export function precisaBuscarVideo(exercise: Pick<Exercise, 'video_url' | 'youtube_video_id'>): boolean {
  return !exercise.video_url && !exercise.youtube_video_id
}

// Evita duas buscas para o mesmo exercício (ex.: import duplo) na mesma sessão.
const emAndamento = new Set<string>()

export function useYouTubeVideoLink() {
  const queryClient = useQueryClient()

  async function vincular(exerciseId: string, videoId: string) {
    const { error } = await supabase.from('exercises').update({ youtube_video_id: videoId }).eq('id', exerciseId)
    if (error) throw error
    queryClient.setQueryData<Exercise[]>(['exercises'], (lista) =>
      lista?.map((e) => (e.id === exerciseId ? { ...e, youtube_video_id: videoId } : e)),
    )
    await queryClient.invalidateQueries({ queryKey: ['exercises'] })
  }

  /** Busca silenciosa ao cadastrar: pega o primeiro resultado e salva. Falhas ficam quietas. */
  async function vincularAutomatico(exercise: Pick<Exercise, 'id' | 'nome' | 'grupo_muscular' | 'video_url' | 'youtube_video_id'>) {
    if (!youtubeConfigurado || !precisaBuscarVideo(exercise) || emAndamento.has(exercise.id)) return null
    emAndamento.add(exercise.id)
    try {
      const [primeiro] = await searchExerciseVideos(exercise.nome, exercise.grupo_muscular)
      if (!primeiro) return null
      await vincular(exercise.id, primeiro.id)
      return primeiro
    } catch {
      return null
    } finally {
      emAndamento.delete(exercise.id)
    }
  }

  return { vincular, vincularAutomatico }
}

/**
 * Tela de execução: exercício sem vídeo próprio nem ID salvo busca o vídeo uma vez e salva
 * (o próximo treino já abre com ele). Sem chave do YouTube ou sem resultado, não faz nada.
 */
export function useVideoAutomatico(exercise: Pick<Exercise, 'id' | 'nome' | 'grupo_muscular' | 'video_url' | 'gif_url' | 'youtube_video_id'> | undefined) {
  const { vincularAutomatico } = useYouTubeVideoLink()
  const semMidia = !!exercise && !exercise.video_url && !exercise.gif_url && !exercise.youtube_video_id

  useEffect(() => {
    if (exercise && semMidia) void vincularAutomatico(exercise)
    // Só ao abrir o exercício (ou quando ele ganha/perde mídia): a busca custa cota.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.id, semMidia])

  return { buscando: semMidia && youtubeConfigurado }
}
