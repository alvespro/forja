import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseForm } from '@/components/workout/exercise-form'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { useDeleteExercise, useUpdateExercise } from '@/hooks/use-exercises'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

type ExerciseCardProps = {
  exercise: Exercise
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const updateExercise = useUpdateExercise()
  const deleteExercise = useDeleteExercise()

  function handleDelete() {
    if (!window.confirm(`Excluir o exercício "${exercise.nome}"? Essa ação não pode ser desfeita.`)) return
    deleteExercise.mutate(exercise.id)
  }

  if (isEditing) {
    return (
      <ExerciseForm
        exercise={exercise}
        isSubmitting={updateExercise.isPending}
        onCancel={() => setIsEditing(false)}
        onSubmit={(values) =>
          updateExercise.mutate({ id: exercise.id, values }, { onSuccess: () => setIsEditing(false) })
        }
      />
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-start gap-2 text-left"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{exercise.nome}</span>
              {exercise.grupo_muscular && (
                <span className="text-xs text-aco-texto">{exercise.grupo_muscular}</span>
              )}
            </div>
          </button>

          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar exercício ${exercise.nome}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir exercício ${exercise.nome}`}
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {exercise.youtube_video_id && (
              <YoutubeEmbed videoId={exercise.youtube_video_id} title={exercise.nome} />
            )}
            {exercise.cadencia_padrao && (
              <p className="text-sm">
                <span className="font-medium text-aco-texto">Cadência padrão: </span>
                {exercise.cadencia_padrao}
              </p>
            )}
            {exercise.cues && (
              <p className="text-sm">
                <span className="font-medium text-aco-texto">Execução: </span>
                {exercise.cues}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
