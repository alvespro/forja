import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseForm } from '@/components/workout/exercise-form'
import { useExerciseLoadSummary } from '@/hooks/use-exercise-load-summary'
import { useCreateExercise, useExercises } from '@/hooks/use-exercises'
import { groupSortIndex, iconForGroup, SEM_GRUPO } from '@/lib/muscle-groups'
import type { Exercise } from '@/types/database'

type GroupBucket = { grupo: string; exercises: Exercise[] }

export function ExerciseLibrary() {
  const exercises = useExercises()
  const createExercise = useCreateExercise()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const buckets = useMemo<GroupBucket[]>(() => {
    const map = new Map<string, Exercise[]>()
    for (const ex of exercises.data ?? []) {
      const grupo = ex.grupo_muscular?.trim() || SEM_GRUPO
      const list = map.get(grupo) ?? []
      list.push(ex)
      map.set(grupo, list)
    }
    return [...map.entries()]
      .map(([grupo, list]) => ({ grupo, exercises: list }))
      .sort((a, b) => groupSortIndex(a.grupo) - groupSortIndex(b.grupo) || a.grupo.localeCompare(b.grupo))
  }, [exercises.data])

  const selectedExercises = useMemo(
    () => buckets.find((b) => b.grupo === selectedGroup)?.exercises ?? [],
    [buckets, selectedGroup],
  )

  if (exercises.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (exercises.isError) {
    return <ErrorState message="Não foi possível carregar os exercícios." onRetry={() => exercises.refetch()} />
  }

  // Formulário de novo exercício (compartilhado pelos dois níveis)
  if (isAdding) {
    return (
      <ExerciseForm
        isSubmitting={createExercise.isPending}
        onCancel={() => setIsAdding(false)}
        onSubmit={(values) => createExercise.mutate(values, { onSuccess: () => setIsAdding(false) })}
      />
    )
  }

  // NÍVEL 2 — lista de exercícios do grupo selecionado
  if (selectedGroup) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="flex min-h-11 items-center gap-1 rounded-md pr-2 text-left font-heading text-lg font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5 text-aco-texto" aria-hidden="true" />
            {iconForGroup(selectedGroup)} {selectedGroup}
            <span className="ml-1 text-sm font-normal text-aco-texto">({selectedExercises.length})</span>
          </button>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Exercício
          </Button>
        </div>

        {selectedExercises.length === 0 ? (
          <EmptyState message="Nenhum exercício neste grupo." />
        ) : (
          <ExerciseGroupList exercises={selectedExercises} />
        )}
      </div>
    )
  }

  // NÍVEL 1 — grade de grupos musculares
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-aco-texto">Escolha o grupo muscular.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="size-3.5" aria-hidden="true" />
          Exercício
        </Button>
      </div>

      {buckets.length === 0 ? (
        <EmptyState message="Nenhum exercício cadastrado ainda." />
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {buckets.map((bucket) => (
            <button
              key={bucket.grupo}
              type="button"
              onClick={() => setSelectedGroup(bucket.grupo)}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-3 text-center outline-none transition-colors hover:border-brasa/50 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                {iconForGroup(bucket.grupo)}
              </span>
              <span className="line-clamp-1 text-sm font-medium text-foreground">{bucket.grupo}</span>
              <span className="text-xs text-aco-texto">
                {bucket.exercises.length} {bucket.exercises.length === 1 ? 'exercício' : 'exercícios'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Lista de exercícios de um grupo, com thumbnail, última carga e badge de recorde. */
function ExerciseGroupList({ exercises }: { exercises: Exercise[] }) {
  const navigate = useNavigate()
  const loads = useExerciseLoadSummary(exercises.map((e) => e.id))

  return (
    <div className="flex flex-col gap-3">
      {exercises.map((exercise) => {
        const summary = loads.data?.get(exercise.id)
        return (
          <Card key={exercise.id}>
            <CardContent className="flex items-center gap-3">
              {exercise.youtube_video_id ? (
                <img
                  src={`https://img.youtube.com/vi/${exercise.youtube_video_id}/mqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-14 w-24 shrink-0 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md border border-border bg-aco text-2xl">
                  {iconForGroup(exercise.grupo_muscular)}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium text-foreground">{exercise.nome}</span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {summary?.last != null && (
                    <span className="text-aco-texto">Última: {summary.last}kg</span>
                  )}
                  {summary?.max != null && (
                    <span className="rounded-full bg-brasa/15 px-2 py-0.5 font-medium text-brasa">
                      PR {summary.max}kg
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => navigate(`/workout/exercicio/${exercise.id}`)}
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
