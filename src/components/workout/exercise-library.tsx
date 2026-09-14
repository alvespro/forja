import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'

import { BodyMap } from '@/components/BodyMap'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { ExerciseTile } from '@/components/ds/exercise-tile'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseForm } from '@/components/workout/exercise-form'
import { useExerciseLoadSummary } from '@/hooks/use-exercise-load-summary'
import { useCreateExercise, useExercises } from '@/hooks/use-exercises'
import { gradientForGroup, groupSortIndex, SEM_GRUPO } from '@/lib/muscle-groups'
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
          <Skeleton key={i} className="aspect-square w-full rounded-[var(--radius-lg)]" />
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
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-md pr-2 text-left ds-h3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5 text-aco-texto" aria-hidden="true" />
            <span className="truncate first-letter:uppercase">{selectedGroup}</span>
            <span className="ds-data-md text-aco-texto">{selectedExercises.length}</span>
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
        <span className="ds-label">Grupos musculares</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="size-3.5" aria-hidden="true" />
          Exercício
        </Button>
      </div>

      {buckets.length === 0 ? (
        <EmptyState message="Nenhum exercício cadastrado ainda." />
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {buckets.map((bucket, i) => (
            <button
              key={bucket.grupo}
              type="button"
              onClick={() => setSelectedGroup(bucket.grupo)}
              aria-label={`${bucket.grupo}: ${bucket.exercises.length} exercício${bucket.exercises.length === 1 ? '' : 's'}`}
              className="ds-pressable-card ds-stagger relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[var(--radius-lg)] border border-white/5 p-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: gradientForGroup(bucket.grupo), animationDelay: `${i * 40}ms` }}
            >
              <span className="absolute right-2 top-2 rounded-full bg-black/35 px-1.5 py-0.5 ds-data-sm text-nevoa">
                {bucket.exercises.length}
              </span>
              <BodyMap size="tile" musculosAtivos={[bucket.grupo]} />
              <span className="line-clamp-1 w-full shrink-0 ds-body-sm font-semibold text-foreground first-letter:uppercase">{bucket.grupo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Lista de exercícios de um grupo: thumbnail, última carga em destaque e recorde. */
function ExerciseGroupList({ exercises }: { exercises: Exercise[] }) {
  const navigate = useNavigate()
  const loads = useExerciseLoadSummary(exercises.map((e) => e.id))

  return (
    <div className="flex flex-col gap-2">
      {exercises.map((exercise, i) => {
        const summary = loads.data?.get(exercise.id)
        return (
          <div key={exercise.id} className="ds-stagger" style={{ animationDelay: `${i * 40}ms` }}>
            <ExerciseTile
              nome={exercise.nome}
              grupo={exercise.grupo_muscular}
              detalhe={summary?.max != null ? `Recorde: ${summary.max} kg` : 'Sem séries registradas'}
              youtubeId={exercise.youtube_video_id}
              ultimaCarga={summary?.last ?? null}
              recorde={summary?.max ?? null}
              onSelect={() => navigate(`/workout/exercicio/${exercise.id}`)}
            />
          </div>
        )
      })}
    </div>
  )
}
