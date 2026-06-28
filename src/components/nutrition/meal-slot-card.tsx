import { useState } from 'react'
import { Plus, Sparkles, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MealLogForm } from '@/components/nutrition/meal-log-form'
import { MealSuggestionsModal } from '@/components/nutrition/meal-suggestions-modal'
import { useCreateMealLog } from '@/hooks/use-meal-logs'
import { cn } from '@/lib/utils'
import type { MealLog, MealSlot } from '@/types/database'

const CARBO_LIMITE_JANTAR = 15

type MealSlotCardProps = {
  slot: MealSlot
  logsHoje: MealLog[]
}

export function MealSlotCard({ slot, logsHoje }: MealSlotCardProps) {
  const [isLogging, setIsLogging] = useState(false)
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

  const isJantar = slot.numero === 6
  const carboAcimaDoLimite = isJantar && registradoHoje.carbo_g > CARBO_LIMITE_JANTAR

  return (
    <Card className={cn(isJantar && 'border-alerta/60')}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{slot.nome}</span>
            <span className="font-mono text-xs text-aco-texto">
              {slot.horario_alvo?.slice(0, 5) ?? '—'} · meta {slot.calorias_alvo ?? '—'} kcal · P
              {slot.proteina_g_alvo ?? '—'} C{slot.carbo_g_alvo ?? '—'} G{slot.gordura_g_alvo ?? '—'}
            </span>
          </div>
          {logsHoje.length > 0 && (
            <span className="shrink-0 font-mono text-xs text-aco-texto">
              hoje: {Math.round(registradoHoje.calorias)} kcal
            </span>
          )}
        </div>

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
          <Button type="button" variant="outline" size="sm" onClick={() => setIsLogging(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Registrar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsSuggesting(true)}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            Ver sugestões
          </Button>
        </div>
      </CardContent>

      <Dialog open={isLogging} onOpenChange={setIsLogging}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar — {slot.nome}</DialogTitle>
          </DialogHeader>
          <MealLogForm
            mealSlotId={slot.id}
            isSubmitting={createMealLog.isPending}
            onCancel={() => setIsLogging(false)}
            onSubmit={(values) => createMealLog.mutate(values, { onSuccess: () => setIsLogging(false) })}
          />
        </DialogContent>
      </Dialog>

      <MealSuggestionsModal slot={slot} open={isSuggesting} onOpenChange={setIsSuggesting} />
    </Card>
  )
}
