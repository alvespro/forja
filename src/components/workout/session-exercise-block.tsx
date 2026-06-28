import { Card, CardContent } from '@/components/ui/card'
import { SetRow } from '@/components/workout/set-row'
import type { Exercise, SetLog, WorkoutExercise } from '@/types/database'

type SessionExerciseBlockProps = {
  sessionId: string
  exercise: Exercise | undefined
  prescription: WorkoutExercise
  logs: SetLog[]
  lastLog: SetLog | undefined
  pausaPadraoSeg: number
  onSetCompleted: (log: SetLog, pausaAlvoSeg: number | null) => void
}

export function SessionExerciseBlock({
  sessionId,
  exercise,
  prescription,
  logs,
  lastLog,
  pausaPadraoSeg,
  onSetCompleted,
}: SessionExerciseBlockProps) {
  const totalSeries = prescription.series_alvo ?? logs.length ?? 1
  const seriesNums = Array.from({ length: Math.max(totalSeries, logs.length) }, (_, i) => i + 1)

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{exercise?.nome ?? 'Exercício'}</span>
          <span className="text-xs text-aco-texto">
            {prescription.series_alvo ?? '—'}x{prescription.reps_alvo ?? '—'} · pausa alvo{' '}
            {prescription.pausa_alvo_seg ?? '—'}s
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {seriesNums.map((serieNum) => (
            <SetRow
              key={serieNum}
              sessionId={sessionId}
              exerciseId={prescription.exercise_id}
              serieNum={serieNum}
              prescription={prescription}
              existingLog={logs.find((log) => log.serie_num === serieNum)}
              lastLog={lastLog}
              pausaPadraoSeg={pausaPadraoSeg}
              onSetCompleted={(log) => onSetCompleted(log, prescription.pausa_alvo_seg)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
