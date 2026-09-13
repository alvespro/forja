import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseProgressChart } from '@/components/workout/exercise-progress-chart'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { computeSessionAggregates } from '@/lib/workout-metrics'

export function EvolucaoExercicioPage() {
  const { id = '' } = useParams()
  const exercises = useExercises()
  const history = useExerciseHistory(id)

  const exercise = exercises.data?.find((e) => e.id === id)
  const aggregates = useMemo(() => computeSessionAggregates(history.data ?? []), [history.data])

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/workout/exercicio/${id}`}
        className="flex min-h-11 w-fit items-center gap-1 text-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {exercise?.nome ?? 'Exercício'}
      </Link>

      <h1 className="font-heading text-2xl font-bold text-foreground">Evolução</h1>

      {history.isError ? (
        <ErrorState message="Não foi possível carregar o histórico." onRetry={() => history.refetch()} />
      ) : history.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : aggregates.length < 2 ? (
        <EmptyState message="Registre pelo menos duas sessões para ver a evolução." />
      ) : (
        <Card>
          <CardContent>
            <ExerciseProgressChart aggregates={aggregates} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
