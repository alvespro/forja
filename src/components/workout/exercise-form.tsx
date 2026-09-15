import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ExerciseInput } from '@/hooks/use-exercises'
import { extractYoutubeId } from '@/lib/youtube'
import type { Exercise } from '@/types/database'

type ExerciseFormProps = {
  exercise?: Exercise
  onSubmit: (values: ExerciseInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ExerciseForm({ exercise, onSubmit, onCancel, isSubmitting }: ExerciseFormProps) {
  const [nome, setNome] = useState(exercise?.nome ?? '')
  const [grupoMuscular, setGrupoMuscular] = useState(exercise?.grupo_muscular ?? '')
  const [videoUrl, setVideoUrl] = useState(
    exercise?.youtube_video_id ? `https://youtu.be/${exercise.youtube_video_id}` : '',
  )
  const [cues, setCues] = useState(exercise?.cues ?? '')
  const [cadenciaPadrao, setCadenciaPadrao] = useState(exercise?.cadencia_padrao ?? '')
  const [videoError, setVideoError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim()) return

    let youtubeVideoId: string | null = null
    if (videoUrl.trim()) {
      const extracted = extractYoutubeId(videoUrl)
      if (!extracted) {
        setVideoError('URL do YouTube inválida. Cole o link completo do vídeo.')
        return
      }
      youtubeVideoId = extracted
    }
    setVideoError(null)

    onSubmit({
      nome: nome.trim(),
      grupo_muscular: grupoMuscular.trim() || null,
      youtube_video_id: youtubeVideoId,
      cues: cues.trim() || null,
      cadencia_padrao: cadenciaPadrao.trim() || null,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-nome">Nome</Label>
          <Input
            id="ex-nome"
            autoFocus
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-grupo">Grupo muscular</Label>
          <Input
            id="ex-grupo"
            placeholder="peito, costas, pernas…"
            value={grupoMuscular}
            onChange={(event) => setGrupoMuscular(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-video">Vídeo do YouTube (URL)</Label>
        <Input
          id="ex-video"
          placeholder="https://youtu.be/…"
          value={videoUrl}
          onChange={(event) => {
            setVideoUrl(event.target.value)
            setVideoError(null)
          }}
          aria-invalid={!!videoError}
        />
        {videoError && <p className="text-xs text-alerta-texto">{videoError}</p>}
        <p className="text-xs text-aco-texto">Só o ID é salvo; o vídeo é exibido via youtube-nocookie.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ex-cadencia">Cadência padrão</Label>
          <Input
            id="ex-cadencia"
            placeholder="ex: 3010"
            value={cadenciaPadrao}
            onChange={(event) => setCadenciaPadrao(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-cues">Dicas de execução</Label>
        <Textarea id="ex-cues" rows={2} value={cues} onChange={(event) => setCues(event.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !nome.trim()}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
