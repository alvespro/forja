import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Icon } from '@/components/Icon'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { ExerciseSearch } from '@/components/ExerciseSearch'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseMedia } from '@/components/workout/exercise-media'
import { YoutubeEmbed } from '@/components/workout/youtube-embed'
import { YoutubeVideoPicker } from '@/components/workout/youtube-video-picker'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useExercises } from '@/hooks/use-exercises'
import { useWorkoutExercisesByExercise } from '@/hooks/use-workout-exercises'
import { explainCadence, splitCues } from '@/lib/cadence'
import { alongamentosRelacionados, CATEGORIA_LABEL, type Candidato } from '@/lib/exercisedb'
import { computeSessionAggregates } from '@/lib/workout-metrics'

const NIVEL_LABEL: Record<string, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }

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

  const { last5, setsPerSession, ultimaSerie, serie } = useMemo(() => {
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
    return {
      last5: aggregates.slice(-5).reverse(),
      setsPerSession: counts,
      ultimaSerie: melhor,
      serie: aggregates.slice(-12).map((a) => ({ id: a.sessionId, rm: Math.round(a.melhor1RM) })),
    }
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
          {exercise.equipamento && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm text-aco-texto first-letter:uppercase">
              {exercise.equipamento}
            </span>
          )}
          {exercise.nivel && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm text-aco-texto">{NIVEL_LABEL[exercise.nivel] ?? exercise.nivel}</span>
          )}
          {exercise.categoria && (
            <span className="rounded-full bg-aco-claro px-2.5 py-1 ds-body-sm text-aco-texto">{CATEGORIA_LABEL[exercise.categoria]}</span>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <ExerciseMedia exercise={exercise} />
        {/* Com GIF na frente, o vídeo escolhido aparece logo abaixo (a prioridade segue MP4 → GIF → YouTube). */}
        {(exercise.video_url || exercise.gif_url) && exercise.youtube_video_id && (
          <YoutubeEmbed videoId={exercise.youtube_video_id} title={exercise.nome} />
        )}
        {!exercise.video_url && (
          <YoutubeVideoPicker key={exercise.id} exercise={exercise} trocar={!!exercise.youtube_video_id} />
        )}
      </section>

      {ultimaSerie && (
        <div className="flex items-baseline justify-between rounded-[var(--radius-lg)] bg-card px-4 py-3">
          <span className="ds-label">Última sessão</span>
          <span className="ds-data-lg text-foreground tabular-nums">
            {ultimaSerie.carga_kg != null ? `${br(ultimaSerie.carga_kg)} kg` : '—'} × {ultimaSerie.reps ?? '—'} reps
          </span>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="ds-label">{exercise.instrucoes?.length || passos.length === 0 ? 'Como fazer' : 'Execução'}</h2>
        {passos.length === 0 ? (
          <p className="ds-body-sm text-aco-texto">Cole a URL de um vídeo ou adicione instruções.</p>
        ) : (
          <ol className="flex flex-col">
            {passos.map((passo, i) => (
              <li key={i} className="flex min-h-11 items-start gap-3 border-b border-linha py-2.5 last:border-b-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brasa ds-data-md font-bold text-meia-noite tabular-nums">
                  {i + 1}
                </span>
                <span className="ds-body-md text-foreground">{passo}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {dicas.length > 0 && (
        <section className="flex flex-col gap-2 rounded-lg bg-aco-claro p-4">
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
            <span className="ds-body-sm text-aco-texto">Principal:</span>
            {(alvos.length > 0 ? alvos : [exercise.grupo_muscular]).filter(Boolean).map((m) => (
              <span key={m} className="rounded-full bg-brasa/15 px-2.5 py-1 ds-body-sm font-semibold capitalize text-brasa">
                {m}
              </span>
            ))}
          </div>
          {secundarios.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="ds-body-sm text-aco-texto">Secundários:</span>
              {secundarios.map((m) => (
                <span key={m} className="rounded-full bg-aco-claro px-2 py-0.5 text-xs capitalize text-aco-texto">
                  {m}
                </span>
              ))}
            </div>
          )}
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
                    <span className="text-aco-texto">Experimente também: </span>
                    {nomeDaVariacao(v)}
                  </span>
                  <Icon name="arrow_forward" size={16} className="text-brasa" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relacionados.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="ds-label">Alongamentos relacionados</h2>
          <p className="ds-body-sm text-aco-texto">Faça antes deste exercício:</p>
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
                        <Icon name="self_improvement" size={28} className="text-cinza" />
                      </span>
                    )}
                    <span className="line-clamp-2 px-2 text-xs font-medium text-foreground">{r.nome}</span>
                    <span className="mt-auto px-2 pb-2 text-[11px] text-aco-texto tabular-nums">{r.categoria === 'mobilidade' ? '45s' : '30s'}</span>
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
          <div className="flex items-center justify-between gap-3">
            <p className="ds-label">Meu histórico</p>
            {serie.length >= 2 && (
              <div className="h-10 w-28" role="img" aria-label="Evolução do 1RM estimado">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                    <Line type="monotone" dataKey="rm" stroke="var(--color-brasa)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
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

      {!exercise.exercisedb_id && (
        <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-atencao/40 bg-atencao/10 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="ds-h4 text-foreground">📥 Enriquecer com dados do ExerciseDB</h2>
            <p className="ds-body-sm text-aco-texto">GIF, instruções, músculos e nível — seu nome e seus cues continuam.</p>
          </div>
          <button
            type="button"
            onClick={() => setBusca({ aberta: true, termo: '', vincular: true })}
            className="ds-pressable flex min-h-12 items-center justify-center rounded-full bg-atencao px-5 ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Buscar no ExerciseDB
          </button>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => navigate(`/workout/evolucao/${exercise.id}`)}>
          <Icon name="bar_chart" size={16} />
          Ver evolução completa
        </Button>
        {primeiroTreino && (
          <Button type="button" className="min-h-11 flex-1" onClick={() => navigate('/workout', { state: { initialTab: 'treinos' } })}>
            <Icon name="play_arrow" size={16} />
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
      <Icon name="chevron_left" size={16} />
      Treino
    </Link>
  )
}
