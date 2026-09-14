import { useMemo } from 'react'

import { ExerciseFocus } from '@/components/workout/session/session-views'
import { SetRow } from '@/components/workout/set-row'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { computeOverloadSuggestion } from '@/lib/workout-metrics'
import type { Exercise, SetLog, WorkoutExercise } from '@/types/database'

type SessionExerciseBlockProps = {
  sessionId: string
  exercise: Exercise | undefined
  prescription: WorkoutExercise
  logs: SetLog[]
  lastLog: SetLog | undefined
  onSetCompleted: (log: SetLog, pausaAlvoSeg: number | null) => void
}

/** Exercício em execução: foco (nome, vídeo, última carga, sugestão) + séries. */
export function SessionExerciseBlock({
  sessionId,
  exercise,
  prescription,
  logs,
  lastLog,
  onSetCompleted,
}: SessionExerciseBlockProps) {
  const history = useExerciseHistory(prescription.exercise_id)
  const sugestao = useMemo(
    () => computeOverloadSuggestion(history.data ?? [], sessionId, prescription),
    [history.data, sessionId, prescription],
  )

  const totalSeries = Math.max(prescription.series_alvo ?? 1, logs.length)
  const seriesNums = Array.from({ length: totalSeries }, (_, i) => i + 1)

  return (
    <div className="flex flex-col gap-6">
      <ExerciseFocus
        nome={exercise?.nome ?? 'Exercício'}
        grupo={exercise?.grupo_muscular ?? null}
        youtubeId={exercise?.youtube_video_id}
        prescricao={{ series: prescription.series_alvo, reps: prescription.reps_alvo, pausaSeg: prescription.pausa_alvo_seg }}
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
            prescription={prescription}
            existingLog={logs.find((log) => log.serie_num === serieNum)}
            lastLog={lastLog}
            onSetCompleted={(log) => onSetCompleted(log, prescription.pausa_alvo_seg)}
          />
        ))}
      </section>
    </div>
  )
}
