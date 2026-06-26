import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { todayInSaoPaulo } from '@/lib/date'

type MeasurementFormProps = {
  unidade: string | null
  onSubmit: (values: { valor: number; measured_at: string }) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function MeasurementForm({ unidade, onSubmit, onCancel, isSubmitting }: MeasurementFormProps) {
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayInSaoPaulo())

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = Number(valor)
    if (!Number.isFinite(parsed)) return
    onSubmit({ valor: parsed, measured_at: data })
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <label htmlFor="valor" className="text-xs text-aco-texto">
          Valor {unidade && `(${unidade})`}
        </label>
        <Input
          id="valor"
          type="number"
          step="any"
          autoFocus
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          className="w-24"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="medido_em" className="text-xs text-aco-texto">
          Data
        </label>
        <Input
          id="medido_em"
          type="date"
          value={data}
          onChange={(event) => setData(event.target.value)}
          className="w-36"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" size="sm" disabled={isSubmitting || !valor}>
        {isSubmitting ? 'Salvando…' : 'Registrar'}
      </Button>
    </form>
  )
}
