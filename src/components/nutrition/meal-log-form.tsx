import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MealLogInput } from '@/hooks/use-meal-logs'
import { todayInSaoPaulo } from '@/lib/date'

type MealLogFormProps = {
  mealSlotId: string
  onSubmit: (values: MealLogInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function MealLogForm({ mealSlotId, onSubmit, onCancel, isSubmitting }: MealLogFormProps) {
  const [descricao, setDescricao] = useState('')
  const [calorias, setCalorias] = useState('')
  const [proteina, setProteina] = useState('')
  const [carbo, setCarbo] = useState('')
  const [gordura, setGordura] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      meal_slot_id: mealSlotId,
      data: todayInSaoPaulo(),
      descricao: descricao.trim() || null,
      calorias: calorias ? Number(calorias) : null,
      proteina_g: proteina ? Number(proteina) : null,
      carbo_g: carbo ? Number(carbo) : null,
      gordura_g: gordura ? Number(gordura) : null,
    })
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ml-descricao">O que você comeu</Label>
        <Input
          id="ml-descricao"
          autoFocus
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="ex: 200g frango, arroz, salada"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ml-calorias">Calorias</Label>
          <Input
            id="ml-calorias"
            type="number"
            value={calorias}
            onChange={(event) => setCalorias(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ml-proteina">Proteína (g)</Label>
          <Input
            id="ml-proteina"
            type="number"
            value={proteina}
            onChange={(event) => setProteina(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ml-carbo">Carboidrato (g)</Label>
          <Input id="ml-carbo" type="number" value={carbo} onChange={(event) => setCarbo(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ml-gordura">Gordura (g)</Label>
          <Input
            id="ml-gordura"
            type="number"
            value={gordura}
            onChange={(event) => setGordura(event.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}
