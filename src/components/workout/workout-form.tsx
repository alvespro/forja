import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WorkoutInput } from '@/hooks/use-workouts'
import type { Workout } from '@/types/database'

type WorkoutFormProps = {
  workout?: Workout
  defaultOrdem: number
  onSubmit: (values: WorkoutInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function WorkoutForm({ workout, defaultOrdem, onSubmit, onCancel, isSubmitting }: WorkoutFormProps) {
  const [nome, setNome] = useState(workout?.nome ?? '')
  const [foco, setFoco] = useState(workout?.foco ?? '')
  const [ordem, setOrdem] = useState(workout?.ordem ?? defaultOrdem)
  const [ativo, setAtivo] = useState(workout?.ativo ?? true)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!nome.trim()) return
    onSubmit({ nome: nome.trim(), foco: foco.trim() || null, ordem, ativo })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wk-nome">Nome</Label>
          <Input
            id="wk-nome"
            autoFocus
            placeholder="Treino A"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wk-foco">Foco</Label>
          <Input
            id="wk-foco"
            placeholder="Peito, Ombro e Tríceps"
            value={foco}
            onChange={(event) => setFoco(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wk-ordem">Ordem</Label>
          <Input
            id="wk-ordem"
            type="number"
            className="w-20"
            value={ordem}
            onChange={(event) => setOrdem(Number(event.target.value))}
          />
        </div>
        <Label className="mt-5 gap-2">
          <Checkbox checked={ativo} onCheckedChange={(checked) => setAtivo(checked === true)} />
          Ativo
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !nome.trim()}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
