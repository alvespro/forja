import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExerciseForm } from '@/components/workout/exercise-form'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { useDeleteExercise, useUpdateExercise } from '@/hooks/use-exercises'
import { useConfirm } from '@/hooks/use-confirm'
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
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: `Excluir o exercício "${exercise.nome}"?`,
      description: 'Essa ação não pode ser desfeita.',
    })
    if (!ok) return
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
    <>
      {dialog}
      <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={expanded}
          >
            <Icon name="expand_more" size={16} className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{exercise.nome}</span>
              {exercise.grupo_muscular && (
                <span className="truncate text-xs text-aco-texto">{exercise.grupo_muscular}</span>
              )}
            </div>
          </button>

          <div className="flex shrink-0 gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar exercício ${exercise.nome}`}
              onClick={() => setIsEditing(true)}
            >
              <Icon name="edit" size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir exercício ${exercise.nome}`}
              onClick={handleDelete}
            >
              <Icon name="delete" size={14} />
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
    </>
  )
}
