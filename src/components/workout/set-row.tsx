import { useState } from 'react'

import { SetRowView } from '@/components/workout/session/session-views'
import { useCreateSetLog, useUpdateSetLog } from '@/hooks/use-set-logs'
import { haptic } from '@/lib/haptics'
import type { SetLog, WorkoutExercise } from '@/types/database'

type SetRowProps = {
  sessionId: string
  exerciseId: string
  serieNum: number
  prescription: WorkoutExercise | undefined
  existingLog: SetLog | undefined
  lastLog: SetLog | undefined
  onSetCompleted: (log: SetLog) => void
}

/** Container da série: estado dos inputs + gravação. O visual é o SetRowView. */
export function SetRow({ sessionId, exerciseId, serieNum, prescription, existingLog, lastLog, onSetCompleted }: SetRowProps) {
  const [isEditing, setIsEditing] = useState(!existingLog)
  const [valores, setValores] = useState({
    // Pré-preenche com a última carga/reps do exercício para agilizar o registro.
    carga: String(existingLog?.carga_kg ?? lastLog?.carga_kg ?? ''),
    reps: String(existingLog?.reps ?? lastLog?.reps ?? ''),
    rpe: String(existingLog?.rpe ?? ''),
    cadencia: existingLog?.cadencia ?? prescription?.cadencia_alvo ?? '',
  })

  const createSetLog = useCreateSetLog()
  const updateSetLog = useUpdateSetLog()
  const saving = createSetLog.isPending || updateSetLog.isPending

  function handleComplete() {
    const values = {
      session_id: sessionId,
      exercise_id: exerciseId,
      serie_num: serieNum,
      carga_kg: valores.carga ? Number(valores.carga) : null,
      reps: valores.reps ? Number(valores.reps) : null,
      // A pausa real é gravada pelo cronômetro quando ela termina (updateSetLogPausa).
      pausa_seg: existingLog?.pausa_seg ?? null,
      cadencia: valores.cadencia.trim() || null,
      rpe: valores.rpe ? Number(valores.rpe) : null,
      concluida: true,
    }

    if (existingLog) {
      updateSetLog.mutate({ id: existingLog.id, values }, { onSuccess: () => setIsEditing(false) })
    } else {
      createSetLog.mutate(values, {
        onSuccess: (createdLog) => {
          haptic('light')
          setIsEditing(false)
          onSetCompleted(createdLog)
        },
      })
    }
  }

  return (
    <SetRowView
      serieNum={serieNum}
      {...valores}
      concluida={!isEditing && !!existingLog}
      saving={saving}
      onChange={(campo, valor) => setValores((v) => ({ ...v, [campo]: valor }))}
      onComplete={handleComplete}
      onEdit={() => setIsEditing(true)}
    />
  )
}
