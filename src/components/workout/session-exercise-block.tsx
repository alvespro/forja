import { useMemo } from 'react'

import { Icon } from '@/components/Icon'
import { ExerciseMedia } from '@/components/workout/exercise-media'
import { ObservacaoDestaque } from '@/components/workout/session/phase-views'
import { ExerciseFocus } from '@/components/workout/session/session-views'
import { SetRow } from '@/components/workout/set-row'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { useVideoAutomatico } from '@/hooks/useYouTubeSearch'
import { computeOverloadSuggestion } from '@/lib/workout-metrics'
import { metaReps } from '@/lib/workout-phases'
import type { Exercise, SetLog, WorkoutExercise } from '@/types/database'

type SessionExerciseBlockProps = {
  sessionId: string
  exercise: Exercise | undefined
  prescription: WorkoutExercise
  logs: SetLog[]
  lastLog: SetLog | undefined
  /** Séries deste exercício nesta sessão (prescritas + extras). */
  totalSeries: number
  /** Séries extras adicionadas (além das prescritas). */
  extras: number
  /** Séries já confirmadas deste exercício (a próxima é a "atual"). */
  confirmadas: number
  /** Deslocamento do serie_num (2ª ocorrência do mesmo exercício no treino). */
  serieBase: number
  onSerieConfirmada: (serieNum: number, log: SetLog) => void
  onAdicionarSerie: () => void
  onRemoverSerieExtra: () => void
}

/** Exercício em execução: foco (nome, vídeo, última carga, sugestão) + séries. */
export function SessionExerciseBlock({
  sessionId,
  exercise,
  prescription,
  logs,
  lastLog,
  totalSeries,
  extras,
  confirmadas,
  serieBase,
  onSerieConfirmada,
  onAdicionarSerie,
  onRemoverSerieExtra,
}: SessionExerciseBlockProps) {
  const history = useExerciseHistory(prescription.exercise_id)
  useVideoAutomatico(exercise)
  const sugestao = useMemo(
    () => computeOverloadSuggestion(history.data ?? [], sessionId, prescription),
    [history.data, sessionId, prescription],
  )

  // Recorde do exercício antes de hoje e maior carga já feita nesta sessão.
  const historicoMaxKg = useMemo(() => {
    const cargas = (history.data ?? [])
      .filter((l) => l.session_id !== sessionId && l.carga_kg != null)
      .map((l) => l.carga_kg as number)
    return cargas.length > 0 ? Math.max(...cargas) : null
  }, [history.data, sessionId])
  const sessaoMaxKg = useMemo(() => {
    const cargas = logs.filter((l) => l.concluida && l.carga_kg != null).map((l) => l.carga_kg as number)
    return cargas.length > 0 ? Math.max(...cargas) : null
  }, [logs])

  // Prescritas + extras pedidas pelo usuário: logs a mais (duplicatas antigas) não criam linha.
  const seriesNums = Array.from({ length: totalSeries }, (_, i) => i + 1)

  return (
    <div className="flex flex-col gap-6">
      <ExerciseFocus
        media={exercise && (exercise.video_url || exercise.gif_url) ? <ExerciseMedia exercise={exercise} className="rounded-none" /> : undefined}
        nome={exercise?.nome ?? 'Exercício'}
        grupo={exercise?.grupo_muscular ?? null}
        youtubeId={exercise?.youtube_video_id}
        prescricao={{
          series: prescription.series_alvo,
          // Isometria (ex.: prancha) não tem reps: a meta é o tempo.
          reps: metaReps(prescription) ?? (prescription.tempo_seg ? `${prescription.tempo_seg}s` : null),
          pausaSeg: prescription.pausa_alvo_seg,
        }}
        destaque={<ObservacaoDestaque texto={prescription.observacao} />}
        ultima={lastLog ? { cargaKg: lastLog.carga_kg, reps: lastLog.reps } : null}
        sugestao={sugestao}
      />

      <section className="flex flex-col gap-2">
        <span className="ds-label">Séries</span>
        {seriesNums.map((serieNum) => (
          <SetRow
            key={serieNum}
            sessionId={sessionId}
            exerciseId={prescription.exercise_id}
            serieNum={serieNum}
            serieNumDb={serieBase + serieNum}
            estado={serieNum <= confirmadas ? 'feita' : serieNum === confirmadas + 1 ? 'atual' : 'bloqueada'}
            prescription={prescription}
            existingLog={logs.find((log) => log.serie_num === serieBase + serieNum)}
            lastLog={lastLog}
            exerciseNome={exercise?.nome ?? 'exercício'}
            historicoMaxKg={historicoMaxKg}
            sessaoMaxKg={sessaoMaxKg}
            onConfirmada={(log) => onSerieConfirmada(serieNum, log)}
          />
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAdicionarSerie}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-linha px-4 ds-body-sm text-aco-texto outline-none hover:border-brasa hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="add" size={18} />
            Adicionar série
          </button>
          {/* Só dá para tirar uma extra que ainda não foi feita. */}
          {extras > 0 && confirmadas < totalSeries && (
            <button
              type="button"
              onClick={onRemoverSerieExtra}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-3 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="remove" size={18} />
              Remover série extra
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
