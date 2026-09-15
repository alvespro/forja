import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, BarChart3, ChevronLeft, Download, Play } from 'lucide-react'

import { ExerciseSearch } from '@/components/ExerciseSearch'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseMedia } from '@/components/workout/exercise-media'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { useWorkoutExercisesByExercise } from '@/hooks/use-workout-exercises'
import { explainCadence, splitCues } from '@/lib/cadence'
import { alongamentosRelacionados, CATEGORIA_LABEL, type Candidato } from '@/lib/exercisedb'
import { computeSessionAggregates } from '@/lib/workout-metrics'

const br = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** "Decline Bench Press: descrição" → "Decline Bench Press" (termo de busca). */
const nomeDaVariacao = (texto: string) => texto.split(':')[0].trim()

export function ExercicioDetalhePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exercises = useExercises()
  const history = useExerciseHistory(id)
  const prescriptions = useWorkoutExercisesByExercise(id)
  const [busca, setBusca] = useState<{ aberta: boolean; termo: string; vincular: boolean }>({ aberta: false, termo: '', vincular: true })

  const exercise = exercises.data?.find((e) => e.id === id)

  const { last5, setsPerSession, ultimaSerie } = useMemo(() => {
    const logs = history.data ?? []
    const aggregates = computeSessionAggregates(logs)
    const counts = new Map<string, number>()
    for (const log of logs) counts.set(log.session_id, (counts.get(log.session_id) ?? 0) + 1)
    // Melhor série da sessão mais recente: "70 kg × 12 reps".
    const ultima = aggregates[aggregates.length - 1]
    const melhor = ultima
      ? logs
          .filter((l) => l.session_id === ultima.sessionId)
          .reduce<(typeof logs)[number] | null>((m, l) => ((l.carga_kg ?? 0) > (m?.carga_kg ?? -1) ? l : m), null)
      : null
    return { last5: aggregates.slice(-5).reverse(), setsPerSession: counts, ultimaSerie: melhor }
  }, [history.data])

  const relacionados = useMemo(
    () =>
      exercise
        ? alongamentosRelacionados(exercise.grupo_muscular, (exercises.data ?? []) as unknown as Candidato[], 3)
        : [],
    [exercise, exercises.data],
  )

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

  const cadencia = explainCadence(exercise.cadencia_padrao)
  // Instruções do ExerciseDB; sem import, os cues cadastrados à mão.
  const passos = exercise.instrucoes?.length ? exercise.instrucoes : splitCues(exercise.cues)
  const dicas = exercise.dicas_execucao ?? []
  const variacoes = exercise.variacoes ?? []
  const variacoesEn = exercise.exercisedb_data?.variations_en ?? []
  const alvos = exercise.exercisedb_data?.target_muscles ?? []
  const secundarios = exercise.musculos_secundarios ?? []
  const primeiroTreino = prescriptions.data?.[0]?.workout_id ?? null
  const nomeOriginal = exercise.exercisedb_data?.original_name

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <BackLink />

      <header className="flex flex-col gap-2">
        <h1 className="ds-h2 text-foreground">{exercise.nome}</h1>
        {nomeOriginal && nomeOriginal.toLowerCase() !== exercise.nome.toLowerCase() && (
          <p className="ds-body-sm capitalize text-aco-texto">{nomeOriginal}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {exercise.grupo_muscular && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm font-medium text-foreground first-letter:uppercase">
              {exercise.grupo_muscular}
            </span>
          )}
          {exercise.categoria && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm text-aco-texto">{CATEGORIA_LABEL[exercise.categoria]}</span>
          )}
          {exercise.equipamento && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm text-aco-texto first-letter:uppercase">
              {exercise.equipamento}
            </span>
          )}
        </div>
      </header>

      <ExerciseMedia exercise={exercise} />

      {!exercise.exercisedb_id && (
        <button
          type="button"
          onClick={() => setBusca({ aberta: true, termo: '', vincular: true })}
          className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-brasa/60 px-5 ds-body-md font-semibold text-brasa outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="size-4" aria-hidden="true" />
          Importar dados do ExerciseDB
        </button>
      )}

      {ultimaSerie && (
        <div className="flex items-baseline justify-between rounded-[var(--radius-lg)] bg-card px-4 py-3">
          <span className="ds-label">Última sessão</span>
          <span className="ds-data-lg text-foreground tabular-nums">
            {ultimaSerie.carga_kg != null ? `${br(ultimaSerie.carga_kg)} kg` : '—'} × {ultimaSerie.reps ?? '—'} reps
          </span>
        </div>
      )}

      {passos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="ds-label">{exercise.instrucoes?.length ? 'Como fazer' : 'Execução'}</h2>
          <ol className="flex flex-col">
            {passos.map((passo, i) => (
              <li key={i} className="flex min-h-11 items-start gap-3 border-b border-linha py-2.5 last:border-b-0">
                <span className="w-6 shrink-0 text-right ds-data-lg font-bold text-brasa tabular-nums">{i + 1}</span>
                <span className="ds-body-md text-foreground">{passo}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {dicas.length > 0 && (
        <section className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-atencao/25 bg-atencao/5 p-4">
          <h2 className="ds-label">Dicas de execução</h2>
          <ul className="flex flex-col gap-2.5">
            {dicas.map((dica, i) => (
              <li key={i} className="flex gap-2 ds-body-sm text-foreground">
                <span aria-hidden="true">💡</span>
                <span>{dica}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(exercise.grupo_muscular || alvos.length > 0 || secundarios.length > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="ds-label">Músculos trabalhados</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {(alvos.length > 0 ? alvos : [exercise.grupo_muscular]).filter(Boolean).map((m) => (
              <span key={m} className="rounded-full bg-brasa/15 px-2.5 py-1 ds-body-sm font-semibold capitalize text-brasa">
                {m}
              </span>
            ))}
            {secundarios.map((m) => (
              <span key={m} className="rounded-full bg-aco-claro px-2 py-0.5 text-xs capitalize text-aco-texto">
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {variacoes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="ds-label">Variações</h2>
          <ul className="flex flex-col gap-2">
            {variacoes.map((v, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setBusca({ aberta: true, termo: nomeDaVariacao(variacoesEn[i] ?? v), vincular: false })}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-linha bg-card px-3 py-2 text-left outline-none hover:border-brasa/50 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="ds-body-sm text-foreground">
                    <span className="text-aco-texto">Tente também: </span>
                    {nomeDaVariacao(v)}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brasa" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relacionados.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="ds-label">Alongamentos relacionados</h2>
          <p className="ds-body-sm text-aco-texto">Antes deste exercício, faça:</p>
          <ul className="grid grid-cols-3 gap-2">
            {relacionados.map((r) => {
              const ex = exercises.data?.find((e) => e.id === r.id)
              return (
                <li key={r.id}>
                  <Link
                    to={`/workout/exercicio/${r.id}`}
                    className="flex h-full flex-col gap-1.5 overflow-hidden rounded-[var(--radius-md)] border border-linha bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ex?.gif_url || ex?.imagem_url ? (
                      <img src={ex.gif_url ?? ex.imagem_url ?? ''} alt="" loading="lazy" className="aspect-square w-full bg-white object-cover" />
                    ) : (
                      <span className="flex aspect-square w-full items-center justify-center bg-aco text-2xl" aria-hidden="true">
                        🧘
                      </span>
                    )}
                    <span className="line-clamp-2 px-2 pb-2 text-xs font-medium text-foreground">{r.nome}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {(cadencia || exercise.cadencia_padrao) && (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <p className="ds-label">Cadência padrão</p>
            <p className="text-sm text-foreground">
              <span className="font-mono text-brasa">{exercise.cadencia_padrao}</span>
              {cadencia && <span className="text-aco-texto"> — {cadencia}</span>}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="ds-label">Últimas sessões</p>
          {history.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : last5.length === 0 ? (
            <p className="text-sm text-aco-texto">Nenhuma série registrada ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {last5.map((agg) => (
                <div key={agg.sessionId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-aco-texto">{format(new Date(agg.performedAt), 'd MMM', { locale: ptBR })}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-aco-texto">{setsPerSession.get(agg.sessionId) ?? 0} séries</span>
                    <span className="font-medium text-foreground">{agg.cargaMaxima}kg</span>
                    <span className="text-aco-texto">1RM ~{Math.round(agg.melhor1RM)}kg</span>
                    {agg.isPR && <span className="rounded-full bg-brasa/15 px-2 py-0.5 text-xs font-medium text-brasa">PR</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => navigate(`/workout/evolucao/${exercise.id}`)}>
          <BarChart3 className="size-4" aria-hidden="true" />
          Ver evolução completa
        </Button>
        {primeiroTreino && (
          <Button type="button" className="min-h-11 flex-1" onClick={() => navigate('/workout', { state: { initialTab: 'treinos' } })}>
            <Play className="size-4" aria-hidden="true" />
            Iniciar treino com este exercício
          </Button>
        )}
      </div>

      <ExerciseSearch
        open={busca.aberta}
        onClose={() => setBusca((b) => ({ ...b, aberta: false }))}
        exerciseId={busca.vincular ? exercise.id : null}
        termoInicial={busca.termo}
        acaoLabel={busca.vincular ? 'Vincular' : 'Adicionar'}
        onImportado={(novo) => {
          if (!busca.vincular && novo.id !== exercise.id) navigate(`/workout/exercicio/${novo.id}`)
        }}
      />
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
