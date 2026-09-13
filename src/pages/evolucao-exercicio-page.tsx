import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseProgressChart } from '@/components/workout/exercise-progress-chart'
import { SeriesAnalysisTab } from '@/components/workout/series-analysis-tab'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { computeSessionAggregates } from '@/lib/workout-metrics'
import { cn } from '@/lib/utils'

type EvolucaoTab = 'evolucao' | 'series'

const TABS: { id: EvolucaoTab; label: string }[] = [
  { id: 'evolucao', label: 'Evolução' },
  { id: 'series', label: 'Análise de Séries' },
]

export function EvolucaoExercicioPage() {
  const { id = '' } = useParams()
  const exercises = useExercises()
  const history = useExerciseHistory(id)
  const [tab, setTab] = useState<EvolucaoTab>('evolucao')

  const exercise = exercises.data?.find((e) => e.id === id)
  const logs = history.data ?? []
  const aggregates = useMemo(() => computeSessionAggregates(logs), [logs])

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

      <div className="flex flex-wrap gap-1 border-b border-border pb-2" role="tablist" aria-label="Seções de evolução">
        {TABS.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            variant={tab === item.id ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(tab === item.id && 'text-foreground')}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {history.isError ? (
        <ErrorState message="Não foi possível carregar o histórico." onRetry={() => history.refetch()} />
      ) : history.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : tab === 'evolucao' ? (
        aggregates.length < 2 ? (
          <EmptyState message="Registre pelo menos duas sessões para ver a evolução." />
        ) : (
          <Card>
            <CardContent>
              <ExerciseProgressChart aggregates={aggregates} />
            </CardContent>
          </Card>
        )
      ) : (
        <SeriesAnalysisTab logs={logs} />
      )}
    </div>
  )
}
