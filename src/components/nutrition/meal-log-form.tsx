import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { MealLogInput } from '@/hooks/use-meal-logs'
import { todayInSaoPaulo } from '@/lib/date'
import type { MealLog, MealSlot } from '@/types/database'

type MealLogFormProps = {
  mealSlotId: string | null
  slots?: MealSlot[]
  onSubmit: (values: MealLogInput) => void
  onCancel: () => void
  isSubmitting: boolean
  /** Quando presente, o formulário corrige este registro em vez de criar outro. */
  log?: MealLog
}

const MACROS = [
  { key: 'proteina', label: 'P', color: 'var(--ok)' },
  { key: 'carbo', label: 'C', color: 'var(--brasa)' },
  { key: 'gordura', label: 'G', color: 'var(--atencao)' },
] as const

export function MealLogForm({ mealSlotId, slots, onSubmit, onCancel, isSubmitting, log }: MealLogFormProps) {
  const initialSlotId = log?.meal_slot_id ?? mealSlotId ?? ''
  const [slotId, setSlotId] = useState(slots && !slots.some((slot) => slot.id === initialSlotId) ? '' : initialSlotId)
  const [descricao, setDescricao] = useState(log?.descricao ?? '')
  const [calorias, setCalorias] = useState(log?.calorias == null ? '' : String(log.calorias))
  const [proteina, setProteina] = useState(log?.proteina_g == null ? '' : String(log.proteina_g))
  const [carbo, setCarbo] = useState(log?.carbo_g == null ? '' : String(log.carbo_g))
  const [gordura, setGordura] = useState(log?.gordura_g == null ? '' : String(log.gordura_g))
  const [error, setError] = useState<string | null>(null)

  const sameNumber = (input: string, saved: number | null) => input.trim() === '' ? saved == null : Number(input) === saved
  const foodValuesChanged = !!log && (
    descricao.trim() !== (log.descricao ?? '') ||
    !sameNumber(calorias, log.calorias) ||
    !sameNumber(proteina, log.proteina_g) ||
    !sameNumber(carbo, log.carbo_g) ||
    !sameNumber(gordura, log.gordura_g)
  )
  const hasChanges = !log || foodValuesChanged || (slotId || null) !== log.meal_slot_id

  const grams = { proteina: Number(proteina) || 0, carbo: Number(carbo) || 0, gordura: Number(gordura) || 0 }
  const maxGram = Math.max(grams.proteina, grams.carbo, grams.gordura, 1)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!descricao.trim()) {
      setError('Descreva o alimento antes de salvar.')
      return
    }
    if ([calorias, proteina, carbo, gordura].some((value) => value.trim() !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      setError('Use apenas valores numéricos iguais ou maiores que zero.')
      return
    }
    setError(null)
    onSubmit({
      meal_slot_id: slotId || null,
      data: log?.data ?? todayInSaoPaulo(),
      descricao: descricao.trim() || null,
      calorias: calorias ? Number(calorias) : null,
      proteina_g: proteina ? Number(proteina) : null,
      carbo_g: carbo ? Number(carbo) : null,
      gordura_g: gordura ? Number(gordura) : null,
      // Mudar só a refeição preserva a origem; corrigir nome/macros torna o valor manual.
      ...(foodValuesChanged ? { food_id: null, fonte: 'manual' as const } : {}),
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {/* Seção: o que comeu */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="ml-descricao">O que você comeu</Label>
        <Input
          id="ml-descricao"
          autoFocus
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="ex: 200g frango, arroz, salada"
        />
      </section>

      {slots && (
        <section className="flex flex-col gap-1.5">
          <Label htmlFor="ml-slot">Refeição</Label>
          <Select id="ml-slot" value={slotId} onChange={(event) => setSlotId(event.target.value)}>
            <option value="">Sem refeição definida</option>
            {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.nome}</option>)}
          </Select>
        </section>
      )}

      {/* Seção: macros */}
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-3">
        <span className="microlabel">Macros</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ml-calorias">Calorias</Label>
            <Input id="ml-calorias" type="number" inputMode="numeric" min="0" step="1" value={calorias} onChange={(e) => setCalorias(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ml-proteina">Proteína (g)</Label>
            <Input id="ml-proteina" type="number" inputMode="decimal" min="0" step="any" value={proteina} onChange={(e) => setProteina(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ml-carbo">Carboidrato (g)</Label>
            <Input id="ml-carbo" type="number" inputMode="decimal" min="0" step="any" value={carbo} onChange={(e) => setCarbo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ml-gordura">Gordura (g)</Label>
            <Input id="ml-gordura" type="number" inputMode="decimal" min="0" step="any" value={gordura} onChange={(e) => setGordura(e.target.value)} />
          </div>
        </div>

        {/* Prévia dos macros em tempo real */}
        <div className="flex flex-col gap-1.5" aria-hidden="true">
          {MACROS.map((m) => (
            <div key={m.key} className="flex items-center gap-2">
              <span className="w-4 font-mono text-xs" style={{ color: m.color }}>
                {m.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-aco-claro">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(grams[m.key] / maxGram) * 100}%`, backgroundColor: m.color }}
                />
              </div>
              <span className="w-10 text-right font-mono text-xs text-aco-texto">{grams[m.key]}g</span>
            </div>
          ))}
        </div>
        {log?.food_id && <p className="text-xs leading-relaxed text-cinza">Se alterar o nome ou os valores, a origem deste registro passa a ser manual.</p>}
      </section>

      {error && <p role="alert" className="text-sm text-alerta-texto">{error}</p>}

      {/* Rodapé fixo — não some no scroll */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t border-border bg-card px-5 py-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? 'Salvando…' : log ? 'Salvar alterações' : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}
