import { useState } from 'react'
import { Check, Plus, Sparkles, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { FoodSearch } from '@/components/FoodSearch'
import { MealLogForm } from '@/components/nutrition/meal-log-form'
import { MealSuggestionsModal } from '@/components/nutrition/meal-suggestions-modal'
import { useCreateMealLog } from '@/hooks/use-meal-logs'
import { cn } from '@/lib/utils'
import type { MealLog, MealSlot } from '@/types/database'

const CARBO_LIMITE_JANTAR = 15

type MealSlotVariant = 'default' | 'featured' | 'next'

type MealSlotCardProps = {
  slot: MealSlot
  logsHoje: MealLog[]
  variant?: MealSlotVariant
  /** Todas as refeições do plano — permite trocar o slot no modal de porção. */
  allSlots?: MealSlot[]
}

export function MealSlotCard({ slot, logsHoje, variant = 'default', allSlots }: MealSlotCardProps) {
  const [isLogging, setIsLogging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const createMealLog = useCreateMealLog()

  const registradoHoje = logsHoje.reduce(
    (acc, log) => ({
      calorias: acc.calorias + (log.calorias ?? 0),
      proteina_g: acc.proteina_g + (log.proteina_g ?? 0),
      carbo_g: acc.carbo_g + (log.carbo_g ?? 0),
      gordura_g: acc.gordura_g + (log.gordura_g ?? 0),
    }),
    { calorias: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0 },
  )

  const registrado = logsHoje.length > 0
  const isJantar = slot.numero === 6
  const carboAcimaDoLimite = isJantar && registradoHoje.carbo_g > CARBO_LIMITE_JANTAR
  const isFeatured = variant === 'featured'
  const isNext = variant === 'next'
  const horario = slot.horario_alvo?.slice(0, 5) ?? '—'

  return (
    <Card className={cn(isFeatured && 'border-brasa', isJantar && !isFeatured && 'border-alerta/60', isNext && 'opacity-90')}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              {isFeatured && (
                <span className="rounded-full bg-brasa px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-meia-noite">
                  Agora
                </span>
              )}
              {isNext && <span className="text-[10px] font-medium uppercase tracking-wide text-aco-texto">Próxima</span>}
              {registrado && !isFeatured && <Check className="size-3.5 text-ok" aria-label="registrado" />}
              <span className={cn('font-medium text-foreground', isFeatured && 'text-lg')}>{slot.nome}</span>
            </span>
            <span className="font-mono text-xs text-aco-texto">
              {horario} · meta {slot.calorias_alvo ?? '—'} kcal · P{slot.proteina_g_alvo ?? '—'} C
              {slot.carbo_g_alvo ?? '—'} G{slot.gordura_g_alvo ?? '—'}
            </span>
          </div>
          {registrado && (
            <span className="shrink-0 font-mono text-xs text-aco-texto">
              hoje: {Math.round(registradoHoje.calorias)} kcal
            </span>
          )}
        </div>

        {isFeatured && (
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-card/50 p-2 text-center font-mono text-xs">
            {[
              { label: 'kcal', reg: Math.round(registradoHoje.calorias), meta: slot.calorias_alvo },
              { label: 'P', reg: Math.round(registradoHoje.proteina_g), meta: slot.proteina_g_alvo },
              { label: 'C', reg: Math.round(registradoHoje.carbo_g), meta: slot.carbo_g_alvo },
              { label: 'G', reg: Math.round(registradoHoje.gordura_g), meta: slot.gordura_g_alvo },
            ].map((m) => (
              <div key={m.label} className="flex flex-col">
                <span className="text-[10px] text-aco-texto">{m.label}</span>
                <span className="text-foreground">
                  {m.reg}
                  <span className="text-aco-texto">/{m.meta ?? '—'}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {isJantar && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs',
              carboAcimaDoLimite ? 'border-alerta/60 bg-alerta/10 text-alerta' : 'border-alerta/30 bg-alerta/5 text-alerta',
            )}
          >
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              ⚠️ Limite: {CARBO_LIMITE_JANTAR}g carbo
              {carboAcimaDoLimite && ' — Carbo acima do limite — glicemia 103'}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant={isFeatured ? 'default' : 'outline'}
            size={isFeatured ? 'default' : 'sm'}
            className={cn(isFeatured && 'flex-1')}
            onClick={() => setIsSearching(true)}
          >
            <Plus className={isFeatured ? 'size-4' : 'size-3.5'} aria-hidden="true" />
            Registrar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsLogging(true)}>
            Manual
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsSuggesting(true)}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            Sugestões
          </Button>
        </div>
      </CardContent>

      <Modal open={isLogging} onClose={() => setIsLogging(false)} title={`Registrar — ${slot.nome}`}>
        <MealLogForm
          mealSlotId={slot.id}
          isSubmitting={createMealLog.isPending}
          onCancel={() => setIsLogging(false)}
          onSubmit={(values) => createMealLog.mutate(values, { onSuccess: () => setIsLogging(false) })}
        />
      </Modal>

      <FoodSearch
        open={isSearching}
        onClose={() => setIsSearching(false)}
        slots={allSlots ?? [slot]}
        defaultSlotId={slot.id}
      />

      <MealSuggestionsModal slot={slot} open={isSuggesting} onOpenChange={setIsSuggesting} />
    </Card>
  )
}
