import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CardioSessionInput } from '@/hooks/use-cardio-sessions'
import { todayInSaoPaulo } from '@/lib/date'
import type { CardioTipo } from '@/types/database'

type CardioFormProps = {
  onSubmit: (values: CardioSessionInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function CardioForm({ onSubmit, onCancel, isSubmitting }: CardioFormProps) {
  const [tipo, setTipo] = useState<CardioTipo>('longo')
  const [data, setData] = useState(todayInSaoPaulo())
  const [distanciaKm, setDistanciaKm] = useState('')
  const [duracaoMin, setDuracaoMin] = useState('')
  const [fcMedia, setFcMedia] = useState('')
  const [zona, setZona] = useState('')
  const [tiros, setTiros] = useState('')
  const [notas, setNotas] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      tipo,
      performed_at: new Date(`${data}T12:00:00`).toISOString(),
      distancia_km: distanciaKm ? Number(distanciaKm) : null,
      duracao_seg: duracaoMin ? Math.round(Number(duracaoMin) * 60) : null,
      fc_media: fcMedia ? Number(fcMedia) : null,
      zona: zona.trim() || null,
      tiros: tiros.trim() || null,
      notas: notas.trim() || null,
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
          <Label htmlFor="cd-tipo">Tipo</Label>
          <Select id="cd-tipo" value={tipo} onChange={(event) => setTipo(event.target.value as CardioTipo)}>
            <option value="longo">Longo</option>
            <option value="intervalado">Intervalado</option>
            <option value="recuperacao">Recuperação</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cd-data">Data</Label>
          <Input id="cd-data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cd-zona">Zona</Label>
          <Input id="cd-zona" placeholder="Z2" value={zona} onChange={(event) => setZona(event.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cd-distancia">Distância (km)</Label>
          <Input
            id="cd-distancia"
            type="number"
            step="0.01"
            value={distanciaKm}
            onChange={(event) => setDistanciaKm(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cd-duracao">Duração (min)</Label>
          <Input
            id="cd-duracao"
            type="number"
            value={duracaoMin}
            onChange={(event) => setDuracaoMin(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cd-fc">FC média</Label>
          <Input id="cd-fc" type="number" value={fcMedia} onChange={(event) => setFcMedia(event.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cd-tiros">Tiros / intervalos</Label>
        <Input
          id="cd-tiros"
          placeholder="ex: 6x400m com 90s"
          value={tiros}
          onChange={(event) => setTiros(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cd-notas">Notas</Label>
        <Textarea id="cd-notas" rows={2} value={notas} onChange={(event) => setNotas(event.target.value)} />
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
