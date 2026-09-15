import { useRef, useState } from 'react'
import { Pause } from 'lucide-react'

import { BodyMap } from '@/components/BodyMap'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

type ExerciseMediaProps = {
  exercise: Pick<Exercise, 'nome' | 'video_url' | 'gif_url' | 'youtube_video_id' | 'imagem_url' | 'grupo_muscular'>
  className?: string
}

/**
 * Mídia do exercício por prioridade: vídeo do ExerciseDB (loop mudo, sem
 * anúncio nem sugestão) → GIF → YouTube → imagem → BodyMap.
 */
export function ExerciseMedia({ exercise, className }: ExerciseMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pausado, setPausado] = useState(false)

  if (exercise.video_url) {
    return (
      <button
        type="button"
        onClick={() => {
          const v = videoRef.current
          if (!v) return
          if (v.paused) {
            void v.play()
            setPausado(false)
          } else {
            v.pause()
            setPausado(true)
          }
        }}
        aria-label={pausado ? `Continuar vídeo de ${exercise.nome}` : `Pausar vídeo de ${exercise.nome}`}
        className={cn('relative block w-full overflow-hidden rounded-xl bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      >
        <video
          ref={videoRef}
          src={exercise.video_url}
          poster={exercise.imagem_url ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          className="block w-full"
        />
        {pausado && (
          <span className="absolute inset-0 flex items-center justify-center bg-meia-noite/40" aria-hidden="true">
            <Pause className="size-10 text-white" />
          </span>
        )}
      </button>
    )
  }

  if (exercise.gif_url) {
    return <img src={exercise.gif_url} alt={`Demonstração: ${exercise.nome}`} className={cn('w-full rounded-xl bg-white', className)} />
  }

  if (exercise.youtube_video_id) {
    return <YoutubeEmbed videoId={exercise.youtube_video_id} title={exercise.nome} />
  }

  if (exercise.imagem_url) {
    return <img src={exercise.imagem_url} alt={exercise.nome} className={cn('w-full rounded-xl bg-white', className)} />
  }

  return (
    <div className={cn('flex justify-center rounded-xl bg-card py-4', className)}>
      <BodyMap size="lg" musculosAtivos={exercise.grupo_muscular ? [exercise.grupo_muscular] : []} />
    </div>
  )
}
