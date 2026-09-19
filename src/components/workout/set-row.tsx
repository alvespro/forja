import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { SetRowView } from '@/components/workout/session/session-views'
import { useCreateSetLog, useUpdateSetLog } from '@/hooks/use-set-logs'
import { haptic } from '@/lib/haptics'
import { isNewRecord } from '@/lib/workout-metrics'
import type { SetLog, WorkoutExercise } from '@/types/database'

export type EstadoSerie = 'feita' | 'atual' | 'bloqueada'

type SetRowProps = {
  sessionId: string
  exerciseId: string
  /** Número exibido (1..séries do exercício). */
  serieNum: number
  /** Número gravado no banco (desloca na 2ª ocorrência do mesmo exercício). */
  serieNumDb: number
  estado: EstadoSerie
  prescription: WorkoutExercise | undefined
  existingLog: SetLog | undefined
  lastLog: SetLog | undefined
  exerciseNome: string
  historicoMaxKg: number | null
  sessaoMaxKg: number | null
  /** Chamado UMA vez, quando a série atual é confirmada pela primeira vez. */
  onConfirmada: (log: SetLog) => void
}

/** Container da série: estado dos inputs + gravação. O visual é o SetRowView. */
export function SetRow({
  sessionId,
  exerciseId,
  serieNum,
  serieNumDb,
  estado,
  prescription,
  existingLog,
  lastLog,
  exerciseNome,
  historicoMaxKg,
  sessaoMaxKg,
  onConfirmada,
}: SetRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  // Log salvo nesta tela: mostra a série como feita na hora, sem esperar o refetch
  // (antes a linha ficava aberta nesse intervalo e aceitava um 2º toque).
  const [salvo, setSalvo] = useState<SetLog | null>(null)
  const enviandoRef = useRef(false)
  const log = existingLog ?? salvo ?? undefined
  const [valores, setValores] = useState({
    // Pré-preenche com a última carga/reps do exercício para agilizar o registro.
    carga: String(log?.carga_kg ?? lastLog?.carga_kg ?? ''),
    reps: String(log?.reps ?? lastLog?.reps ?? ''),
    rpe: String(log?.rpe ?? ''),
    cadencia: log?.cadencia ?? prescription?.cadencia_alvo ?? '',
  })

  const createSetLog = useCreateSetLog()
  const updateSetLog = useUpdateSetLog()
  const saving = createSetLog.isPending || updateSetLog.isPending

  function handleComplete() {
    // Trava síncrona: dois toques no mesmo frame não geram duas gravações.
    if (enviandoRef.current || estado === 'bloqueada') return
    enviandoRef.current = true
    const liberar = () => {
      enviandoRef.current = false
    }

    const values = {
      session_id: sessionId,
      exercise_id: exerciseId,
      serie_num: serieNumDb,
      carga_kg: valores.carga ? Number(valores.carga) : null,
      reps: valores.reps ? Number(valores.reps) : null,
      // A pausa real é gravada pelo cronômetro quando ela termina (updateSetLogPausa).
      pausa_seg: log?.pausa_seg ?? null,
      cadencia: valores.cadencia.trim() || null,
      rpe: valores.rpe ? Number(valores.rpe) : null,
      concluida: true,
    }

    // Série já feita sendo corrigida: só atualiza — não conta série nem dispara cronômetro.
    if (log && estado === 'feita') {
      updateSetLog.mutate(
        { id: log.id, values },
        { onSuccess: () => setIsEditing(false), onSettled: liberar },
      )
      return
    }

    createSetLog.mutate(values, {
      onSuccess: (createdLog) => {
        if (isNewRecord(values.carga_kg, historicoMaxKg, sessaoMaxKg)) {
          haptic('double')
          toast.success(`🏆 Novo recorde: ${String(values.carga_kg).replace('.', ',')} kg`, { description: exerciseNome })
        } else {
          haptic('light')
        }
        setSalvo(createdLog)
        setIsEditing(false)
        onConfirmada(createdLog)
      },
      onSettled: liberar,
    })
  }

  const concluida = estado === 'feita' && !isEditing && !!log

  return (
    <SetRowView
      serieNum={serieNum}
      {...valores}
      concluida={concluida}
      bloqueada={estado === 'bloqueada'}
      saving={saving}
      onChange={(campo, valor) => setValores((v) => ({ ...v, [campo]: valor }))}
      onComplete={handleComplete}
      onEdit={() => setIsEditing(true)}
    />
  )
}
