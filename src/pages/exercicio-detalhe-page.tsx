import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Check, ChevronLeft, Play } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { useWorkoutExercisesByExercise } from '@/hooks/use-workout-exercises'
import { explainCadence, splitCues } from '@/lib/cadence'
import { iconForGroup } from '@/lib/muscle-groups'
import { computeSessionAggregates } from '@/lib/workout-metrics'

export function ExercicioDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exercises = useExercises()
  const history = useExerciseHistory(id)
  const prescriptions = useWorkoutExercisesByExercise(id)

  const exercise = exercises.data?.find((e) => e.id === id)

  const { last5, setsPerSession } = useMemo(() => {
    const logs = history.data ?? []
    const aggregates = computeSessionAggregates(logs)
    const counts = new Map<string, number>()
    for (const log of logs) counts.set(log.session_id, (counts.get(log.session_id) ?? 0) + 1)
    return { last5: aggregates.slice(-5).reverse(), setsPerSession: counts }
  }, [history.data])

  const cadencia = explainCadence(exercise?.cadencia_padrao ?? null)
  const passos = splitCues(exercise?.cues ?? null)
  const primeiroTreino = prescriptions.data?.[0]?.workout_id ?? null

  if (exercises.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (exercises.isError) {
    return <ErrorState message="Não foi possível carregar o exercício." onRetry={() => exercises.refetch()} />
  }

  if (!exercise) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <EmptyState message="Exercício não encontrado." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink />

      <div className="flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">
          {iconForGroup(exercise.grupo_muscular)}
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{exercise.nome}</h1>
          {exercise.grupo_muscular && <p className="text-sm text-aco-texto">{exercise.grupo_muscular}</p>}
        </div>
      </div>

      {exercise.youtube_video_id && <YoutubeEmbed videoId={exercise.youtube_video_id} title={exercise.nome} />}

      {passos.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="font-heading text-sm font-bold text-foreground">Execução</p>
            <ol className="flex flex-col gap-2">
              {passos.map((passo, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brasa/15 text-brasa">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {(cadencia || exercise.cadencia_padrao) && (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="font-heading text-sm font-bold text-foreground">Cadência padrão</p>
            <p className="text-sm text-foreground">
              <span className="font-mono text-brasa">{exercise.cadencia_padrao}</span>
              {cadencia && <span className="text-aco-texto"> — {cadencia}</span>}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="font-heading text-sm font-bold text-foreground">Últimas sessões</p>
          {history.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : last5.length === 0 ? (
            <p className="text-sm text-aco-texto">Nenhuma série registrada ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {last5.map((agg) => (
                <div key={agg.sessionId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-aco-texto">
                    {format(new Date(agg.performedAt), 'd MMM', { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-aco-texto">{setsPerSession.get(agg.sessionId) ?? 0} séries</span>
                    <span className="font-medium text-foreground">{agg.cargaMaxima}kg</span>
                    <span className="text-aco-texto">1RM ~{Math.round(agg.melhor1RM)}kg</span>
                    {agg.isPR && (
                      <span className="rounded-full bg-brasa/15 px-2 py-0.5 text-xs font-medium text-brasa">PR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/workout/evolucao/${exercise.id}`)}
        >
          <BarChart3 className="size-4" aria-hidden="true" />
          Ver evolução completa
        </Button>
        {primeiroTreino && (
          <Button
            type="button"
            className="flex-1"
            onClick={() => navigate('/workout', { state: { initialTab: 'treinos' } })}
          >
            <Play className="size-4" aria-hidden="true" />
            Iniciar treino com este exercício
          </Button>
        )}
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/workout"
      className="flex min-h-11 w-fit items-center gap-1 text-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      Treino
    </Link>
  )
}
