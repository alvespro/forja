import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { buscarVideosYoutube, useYouTubeVideoLink, youtubeConfigurado, type YoutubeVideo } from '@/hooks/useYouTubeSearch'
import type { Exercise } from '@/types/database'

type YoutubeVideoPickerProps = {
  exercise: Pick<Exercise, 'id' | 'nome' | 'grupo_muscular' | 'youtube_video_id'>
  /** "Trocar vídeo": já há um ID salvo e o usuário pediu outra busca. */
  trocar?: boolean
  onVinculado?: () => void
}

/**
 * Botão "Buscar vídeo no YouTube" → grade de resultados → "Usar este vídeo"
 * grava `youtube_video_id` (cache: a próxima visita não gasta cota).
 */
export function YoutubeVideoPicker({ exercise, trocar = false, onVinculado }: YoutubeVideoPickerProps) {
  const { vincular } = useYouTubeVideoLink()
  const [videos, setVideos] = useState<YoutubeVideo[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)

  async function buscar() {
    setCarregando(true)
    setErro(null)
    try {
      setVideos(await buscarVideosYoutube(exercise.nome, exercise.grupo_muscular))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na busca.')
    } finally {
      setCarregando(false)
    }
  }

  async function usar(video: YoutubeVideo) {
    setSalvando(video.id)
    try {
      await vincular(exercise.id, video.id)
      toast.success('✅ Vídeo vinculado ao exercício')
      setVideos(null)
      onVinculado?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o vídeo.')
    } finally {
      setSalvando(null)
    }
  }

  if (!youtubeConfigurado) return null

  if (videos === null && !carregando) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={buscar}
          className={
            trocar
              ? 'flex min-h-11 w-fit items-center gap-1.5 self-end rounded-full px-3 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
              : 'ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-linha bg-card px-5 ds-body-md font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
          }
        >
          <Icon name="search" size={trocar ? 16 : 20} />
          {trocar ? 'Trocar vídeo' : 'Buscar vídeo no YouTube'}
        </button>
        {erro && <p className="ds-body-sm text-alerta-texto">{erro}</p>}
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-2" aria-label="Vídeos do YouTube">
      <div className="flex items-center justify-between gap-3">
        <h2 className="ds-label">{trocar ? 'Escolha outro vídeo' : 'Escolha um vídeo'}</h2>
        <button
          type="button"
          onClick={() => setVideos(null)}
          className="min-h-11 rounded-full px-3 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancelar
        </button>
      </div>

      {carregando ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : videos && videos.length === 0 ? (
        <p className="ds-body-sm text-aco-texto">Nenhum vídeo incorporável encontrado para “{exercise.nome}”.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {videos?.map((v) => {
            const atual = v.id === exercise.youtube_video_id
            return (
              <li key={v.id} className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-linha bg-card">
                <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full bg-aco object-cover" />
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{v.titulo}</span>
                  <span className="truncate text-[11px] text-aco-texto">{v.canal}</span>
                </div>
                <button
                  type="button"
                  disabled={salvando !== null || atual}
                  onClick={() => usar(v)}
                  className="mx-2 mb-2 flex min-h-11 items-center justify-center gap-1 rounded-full bg-brasa px-2 text-xs font-semibold text-meia-noite outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon name="check" size={14} />
                  {atual ? 'Em uso' : salvando === v.id ? 'Salvando…' : 'Usar este vídeo'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
