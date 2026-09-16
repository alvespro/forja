import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { ExerciseSearch } from '@/components/ExerciseSearch'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { WorkoutExerciseInput } from '@/hooks/use-workout-exercises'
import type { Exercise, WorkoutExercise } from '@/types/database'

type WorkoutExerciseFormProps = {
  workoutId: string
  exercises: Exercise[]
  defaultOrdem: number
  prescription?: WorkoutExercise
  onSubmit: (values: WorkoutExerciseInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function WorkoutExerciseForm({
  workoutId,
  exercises,
  defaultOrdem,
  prescription,
  onSubmit,
  onCancel,
  isSubmitting,
}: WorkoutExerciseFormProps) {
  const [exerciseId, setExerciseId] = useState(prescription?.exercise_id ?? exercises[0]?.id ?? '')
  const [seriesAlvo, setSeriesAlvo] = useState(String(prescription?.series_alvo ?? 3))
  const [repsAlvo, setRepsAlvo] = useState(prescription?.reps_alvo ?? '')
  const [pausaAlvoSeg, setPausaAlvoSeg] = useState(String(prescription?.pausa_alvo_seg ?? 60))
  const [cadenciaAlvo, setCadenciaAlvo] = useState(prescription?.cadencia_alvo ?? '')
  const [notas, setNotas] = useState(prescription?.notas ?? '')
  const [buscandoExerciseDB, setBuscandoExerciseDB] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!exerciseId) return

    onSubmit({
      workout_id: workoutId,
      exercise_id: exerciseId,
      ordem: prescription?.ordem ?? defaultOrdem,
      series_alvo: seriesAlvo ? Number(seriesAlvo) : null,
      reps_alvo: repsAlvo.trim() || null,
      pausa_alvo_seg: pausaAlvoSeg ? Number(pausaAlvoSeg) : null,
      cadencia_alvo: cadenciaAlvo.trim() || null,
      notas: notas.trim() || null,
    })
  }

  if (exercises.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-3 text-sm text-aco-texto">
        Cadastre exercícios na aba "Exercícios" antes de montar a prescrição.
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="we-exercicio">Exercício</Label>
        <Select id="we-exercicio" value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.nome}
            </option>
          ))}
        </Select>
        <Button type="button" variant="ghost" size="sm" className="min-h-11 self-start" onClick={() => setBuscandoExerciseDB(true)}>
          <Icon name="search" size={14} />
          Buscar no ExerciseDB (com GIF)
        </Button>
        <ExerciseSearch
          open={buscandoExerciseDB}
          onClose={() => setBuscandoExerciseDB(false)}
          acaoLabel="Adicionar ao treino"
          onImportado={(exercicio) => setExerciseId(exercicio.id)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-series">Séries</Label>
          <Input
            id="we-series"
            type="number"
            min={1}
            value={seriesAlvo}
            onChange={(event) => setSeriesAlvo(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-reps">Reps</Label>
          <Input
            id="we-reps"
            placeholder="6-12"
            value={repsAlvo}
            onChange={(event) => setRepsAlvo(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-pausa">Pausa (seg)</Label>
          <Input
            id="we-pausa"
            type="number"
            min={0}
            value={pausaAlvoSeg}
            onChange={(event) => setPausaAlvoSeg(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-cadencia">Cadência</Label>
          <Input
            id="we-cadencia"
            placeholder="3010"
            value={cadenciaAlvo}
            onChange={(event) => setCadenciaAlvo(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="we-notas">Notas</Label>
        <Textarea id="we-notas" rows={2} value={notas} onChange={(event) => setNotas(event.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !exerciseId}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
