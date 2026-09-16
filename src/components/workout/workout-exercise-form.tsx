import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { ExerciseSearch } from '@/components/ExerciseSearch'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { WorkoutExerciseInput } from '@/hooks/use-workout-exercises'
import { FASE_LABEL, FASES_EM_ORDEM, faseCronometrada, faseDe } from '@/lib/workout-phases'
import type { Exercise, WorkoutExercise, WorkoutFase } from '@/types/database'

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
  const [fase, setFase] = useState<WorkoutFase>(faseDe(prescription?.fase))
  const [repsMin, setRepsMin] = useState(prescription?.reps_min != null ? String(prescription.reps_min) : '')
  const [repsMax, setRepsMax] = useState(prescription?.reps_max != null ? String(prescription.reps_max) : '')
  const [tempoSeg, setTempoSeg] = useState(prescription?.tempo_seg != null ? String(prescription.tempo_seg) : '')
  const [observacao, setObservacao] = useState(prescription?.observacao ?? '')
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
      // reps_alvo é legado: mantém o valor antigo, a meta vem de reps_min/reps_max.
      reps_alvo: prescription?.reps_alvo ?? null,
      reps_min: repsMin ? Number(repsMin) : null,
      reps_max: repsMax ? Number(repsMax) : repsMin ? Number(repsMin) : null,
      fase,
      tempo_seg: tempoSeg ? Number(tempoSeg) : null,
      observacao: observacao.trim() || null,
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="we-fase">Fase</Label>
        <Select id="we-fase" value={fase} onChange={(event) => setFase(event.target.value as WorkoutFase)}>
          {FASES_EM_ORDEM.map((f) => (
            <option key={f} value={f}>
              {FASE_LABEL[f]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-tempo">{faseCronometrada(fase) || fase === 'cardio' ? 'Tempo (seg)' : 'Tempo (seg, opcional)'}</Label>
          <Input id="we-tempo" type="number" min={0} inputMode="numeric" value={tempoSeg} onChange={(event) => setTempoSeg(event.target.value)} placeholder={fase === 'cardio' ? '1080' : '60'} />
        </div>
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
          <Label htmlFor="we-reps-min">Reps mín.</Label>
          <Input id="we-reps-min" type="number" min={1} inputMode="numeric" placeholder="8" value={repsMin} onChange={(event) => setRepsMin(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="we-reps-max">Reps máx.</Label>
          <Input id="we-reps-max" type="number" min={1} inputMode="numeric" placeholder="12" value={repsMax} onChange={(event) => setRepsMax(event.target.value)} />
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
        <Label htmlFor="we-observacao">Observação em destaque</Label>
        <Input id="we-observacao" value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="SUPERSET — sem descanso entre os 2" />
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
