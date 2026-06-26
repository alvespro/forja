import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateSetLog, useUpdateSetLog } from '@/hooks/use-set-logs'
import { cn } from '@/lib/utils'
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

export function SetRow({
  sessionId,
  exerciseId,
  serieNum,
  prescription,
  existingLog,
  lastLog,
  onSetCompleted,
}: SetRowProps) {
  const [isEditing, setIsEditing] = useState(!existingLog)
  const [carga, setCarga] = useState(String(existingLog?.carga_kg ?? lastLog?.carga_kg ?? ''))
  const [reps, setReps] = useState(String(existingLog?.reps ?? lastLog?.reps ?? ''))
  const [pausa, setPausa] = useState(String(existingLog?.pausa_seg ?? ''))
  const [cadencia, setCadencia] = useState(existingLog?.cadencia ?? prescription?.cadencia_alvo ?? '')
  const [rpe, setRpe] = useState(String(existingLog?.rpe ?? ''))

  const createSetLog = useCreateSetLog()
  const updateSetLog = useUpdateSetLog()
  const isSaving = createSetLog.isPending || updateSetLog.isPending

  function handleComplete() {
    const values = {
      session_id: sessionId,
      exercise_id: exerciseId,
      serie_num: serieNum,
      carga_kg: carga ? Number(carga) : null,
      reps: reps ? Number(reps) : null,
      pausa_seg: pausa ? Number(pausa) : null,
      cadencia: cadencia.trim() || null,
      rpe: rpe ? Number(rpe) : null,
      concluida: true,
    }

    if (existingLog) {
      updateSetLog.mutate(
        { id: existingLog.id, values },
        { onSuccess: () => setIsEditing(false) },
      )
    } else {
      createSetLog.mutate(values, {
        onSuccess: (createdLog) => {
          setIsEditing(false)
          onSetCompleted(createdLog)
        },
      })
    }
  }

  if (!isEditing && existingLog) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Check className="size-3.5 text-ok" aria-hidden="true" />
          <span className="font-mono text-sm text-foreground">
            Série {serieNum}: {existingLog.carga_kg ?? '—'}kg x {existingLog.reps ?? '—'}
            {existingLog.rpe ? ` · RPE ${existingLog.rpe}` : ''}
          </span>
        </div>
        <Pencil className="size-3.5 text-aco-texto" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-aco-texto">Série {serieNum}</span>
        {lastLog && (
          <span className="font-mono text-xs text-aco-texto">
            última: {lastLog.carga_kg ?? '—'}kg x {lastLog.reps ?? '—'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input
          type="number"
          step="0.5"
          placeholder="kg"
          aria-label="Carga em kg"
          value={carga}
          onChange={(event) => setCarga(event.target.value)}
        />
        <Input
          type="number"
          placeholder="reps"
          aria-label="Repetições"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
        />
        <Input
          type="number"
          placeholder="pausa(s)"
          aria-label="Pausa em segundos"
          value={pausa}
          onChange={(event) => setPausa(event.target.value)}
        />
        <Input
          placeholder="cadência"
          aria-label="Cadência"
          value={cadencia}
          onChange={(event) => setCadencia(event.target.value)}
        />
        <Input
          type="number"
          step="0.5"
          min={0}
          max={10}
          placeholder="RPE"
          aria-label="RPE"
          value={rpe}
          onChange={(event) => setRpe(event.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        {existingLog && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          className={cn(!existingLog && 'self-end')}
          disabled={isSaving}
          onClick={handleComplete}
        >
          {isSaving ? 'Salvando...' : 'Concluir série'}
        </Button>
      </div>
    </div>
  )
}
