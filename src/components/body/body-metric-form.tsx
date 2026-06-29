import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BodyMetricInput } from '@/hooks/use-body-metrics'
import { todayInSaoPaulo } from '@/lib/date'

type BodyMetricFormProps = {
  onSubmit: (values: BodyMetricInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function BodyMetricForm({ onSubmit, onCancel, isSubmitting }: BodyMetricFormProps) {
  const [pesoKg, setPesoKg] = useState('')
  const [gorduraPct, setGorduraPct] = useState('')
  const [musculoPct, setMusculoPct] = useState('')
  const [aguaPct, setAguaPct] = useState('')
  const [gorduraVisceral, setGorduraVisceral] = useState('')
  const [imc, setImc] = useState('')
  const [medidoEm, setMedidoEm] = useState(todayInSaoPaulo())

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!pesoKg && !gorduraPct) return
    onSubmit({
      peso_kg: pesoKg ? Number(pesoKg) : null,
      gordura_pct: gorduraPct ? Number(gorduraPct) : null,
      musculo_pct: musculoPct ? Number(musculoPct) : null,
      agua_pct: aguaPct ? Number(aguaPct) : null,
      gordura_visceral: gorduraVisceral ? Number(gorduraVisceral) : null,
      imc: imc ? Number(imc) : null,
      medido_em: medidoEm,
    })
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-peso">Peso (kg)</Label>
          <Input
            id="bm-peso"
            type="number"
            step="0.1"
            value={pesoKg}
            onChange={(event) => setPesoKg(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-gordura">% de gordura</Label>
          <Input
            id="bm-gordura"
            type="number"
            step="0.1"
            value={gorduraPct}
            onChange={(event) => setGorduraPct(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-data">Medido em</Label>
          <Input
            id="bm-data"
            type="date"
            value={medidoEm}
            onChange={(event) => setMedidoEm(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-musculo">% músculo</Label>
          <Input
            id="bm-musculo"
            type="number"
            step="0.1"
            value={musculoPct}
            onChange={(event) => setMusculoPct(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-agua">% água</Label>
          <Input
            id="bm-agua"
            type="number"
            step="0.1"
            value={aguaPct}
            onChange={(event) => setAguaPct(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-visceral">Gordura visceral</Label>
          <Input
            id="bm-visceral"
            type="number"
            step="1"
            value={gorduraVisceral}
            onChange={(event) => setGorduraVisceral(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bm-imc">IMC</Label>
          <Input
            id="bm-imc"
            type="number"
            step="0.1"
            value={imc}
            onChange={(event) => setImc(event.target.value)}
            autoComplete="off"
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
