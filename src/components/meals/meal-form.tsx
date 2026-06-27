import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MealInput } from '@/hooks/use-meals'
import { todayInSaoPaulo } from '@/lib/date'

type MealFormProps = {
  onSubmit: (values: MealInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function MealForm({ onSubmit, onCancel, isSubmitting }: MealFormProps) {
  const [refeicao, setRefeicao] = useState('1')
  const [descricao, setDescricao] = useState('')
  const [proteinaG, setProteinaG] = useState('')
  const [calorias, setCalorias] = useState('')
  const [tipo, setTipo] = useState('')
  const [data, setData] = useState(todayInSaoPaulo())

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const refeicaoNum = Number(refeicao)
    if (!Number.isFinite(refeicaoNum) || refeicaoNum < 1 || refeicaoNum > 6) return
    onSubmit({
      refeicao: refeicaoNum,
      descricao: descricao.trim() || null,
      proteina_g: proteinaG ? Number(proteinaG) : null,
      calorias: calorias ? Number(calorias) : null,
      tipo: tipo.trim() || null,
      data,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-refeicao">Refeição (1-6)</Label>
          <Input
            id="meal-refeicao"
            type="number"
            min="1"
            max="6"
            value={refeicao}
            onChange={(event) => setRefeicao(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-tipo">Tipo</Label>
          <Input
            id="meal-tipo"
            placeholder="ex: café da manhã"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-data">Data</Label>
          <Input id="meal-data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meal-descricao">Descrição</Label>
        <Input
          id="meal-descricao"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="ex: 200g de frango, arroz, salada"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-proteina">Proteína (g)</Label>
          <Input
            id="meal-proteina"
            type="number"
            value={proteinaG}
            onChange={(event) => setProteinaG(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meal-calorias">Calorias</Label>
          <Input
            id="meal-calorias"
            type="number"
            value={calorias}
            onChange={(event) => setCalorias(event.target.value)}
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
