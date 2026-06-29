import { useMemo, useState } from 'react'
import { Brain, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseProgressChart } from '@/components/workout/exercise-progress-chart'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { useWorkoutExercisesByExercise } from '@/hooks/use-workout-exercises'
import { launchForjaChat } from '@/lib/forja-chat-store'
import { computeSessionAggregates, suggestOverload } from '@/lib/workout-metrics'

export function EvolutionTab() {
  const exercises = useExercises()
  const [exerciseId, setExerciseId] = useState('')

  const selectedId = exerciseId || exercises.data?.[0]?.id || ''
  const history = useExerciseHistory(selectedId)
  const prescriptions = useWorkoutExercisesByExercise(selectedId)

  const aggregates = useMemo(() => computeSessionAggregates(history.data ?? []), [history.data])

  const overloadMessage = useMemo(() => {
    const prescription = prescriptions.data?.[0]
    if (!prescription || aggregates.length === 0) return null
    const lastSessionId = aggregates[aggregates.length - 1].sessionId
    const lastSessionLogs = (history.data ?? []).filter((log) => log.session_id === lastSessionId)
    return suggestOverload(lastSessionLogs, prescription)
  }, [prescriptions.data, aggregates, history.data])

  if (exercises.isLoading) {
    return <Skeleton className="h-10 w-56" />
  }

  if (exercises.isError) {
    return <ErrorState message="Não foi possível carregar os exercícios." onRetry={() => exercises.refetch()} />
  }

  if (!exercises.data || exercises.data.length === 0) {
    return <EmptyState message="Cadastre exercícios para acompanhar a evolução de carga." />
  }

  const selectedExercise = exercises.data.find((exercise) => exercise.id === selectedId)

  function handleAskCoach() {
    const contexto = selectedExercise ? ` Estou olhando a evolução do exercício "${selectedExercise.nome}".` : ''
    launchForjaChat({ agente: 'treino', pergunta: `Analise minha evolução de carga e me dê uma dica.${contexto}` })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="evo-exercicio" className="text-xs text-aco-texto">
            Exercício
          </label>
          <Select
            id="evo-exercicio"
            className="w-56"
            value={selectedId}
            onChange={(event) => setExerciseId(event.target.value)}
          >
            {exercises.data.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.nome}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleAskCoach}>
          <Brain className="size-3.5" aria-hidden="true" />
          Perguntar ao coach
        </Button>
      </div>

      {overloadMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-brasa/40 bg-brasa/10 px-3 py-2">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-brasa" aria-hidden="true" />
          <p className="text-sm text-foreground">{overloadMessage}</p>
        </div>
      )}

      {history.isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : history.isError ? (
        <ErrorState message="Não foi possível carregar o histórico." onRetry={() => history.refetch()} />
      ) : aggregates.length === 0 ? (
        <EmptyState message="Nenhuma série registrada ainda para este exercício." />
      ) : (
        <ExerciseProgressChart aggregates={aggregates} />
      )}
    </div>
  )
}
