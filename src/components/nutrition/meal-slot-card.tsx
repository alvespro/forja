import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { NutritionCard } from '@/components/ds/nutrition-card'
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
  /** Horário já passou (esmaecida na lista). */
  passada?: boolean
}

export function MealSlotCard({ slot, logsHoje, variant = 'default', allSlots, passada = false }: MealSlotCardProps) {
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
  const horario = slot.horario_alvo?.slice(0, 5) ?? '—'

  const acaoCls =
    'ds-pressable flex min-h-11 items-center gap-1.5 rounded-[var(--r-md)] border border-linha bg-aco px-3 ds-body-sm font-medium text-cinza outline-none hover:border-cinza hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <>
      <NutritionCard
        nome={slot.nome}
        horario={horario}
        agora={isFeatured}
        passada={passada}
        compact={!isFeatured}
        alerta={carboAcimaDoLimite}
        registrado={registrado}
        kcal={{ atual: registradoHoje.calorias, meta: slot.calorias_alvo ?? 0 }}
        proteina={{ atual: registradoHoje.proteina_g, meta: slot.proteina_g_alvo ?? 0 }}
        carbo={{ atual: registradoHoje.carbo_g, meta: slot.carbo_g_alvo ?? 0 }}
        gordura={{ atual: registradoHoje.gordura_g, meta: slot.gordura_g_alvo ?? 0 }}
        onRegistrar={() => setIsSearching(true)}
        aviso={
          isJantar && (
            <div
              role={carboAcimaDoLimite ? 'alert' : undefined}
              className={cn(
                'ds-terminal-sm flex items-center gap-2 rounded-[var(--r-sm)] border-l-[3px] px-3 py-2 text-brasa',
                carboAcimaDoLimite ? 'border-alerta bg-alerta/15' : 'border-brasa/50 bg-brasa/5',
              )}
            >
              <Icon name="warning" size={16} />
              {carboAcimaDoLimite ? 'Limite carbo — glicemia 103' : `Limite carbo ${CARBO_LIMITE_JANTAR}g`}
            </div>
          )
        }
        extra={
          // Manual e Sugestões em todas as refeições: o lançamento manual é o único
          // caminho para comida caseira sem código de barras, inclusive em refeição já passada.
          <>
              <button type="button" className={acaoCls} onClick={() => setIsLogging(true)}>
                <Icon name="edit_note" size={14} />
                Manual
              </button>
              <button type="button" className={acaoCls} onClick={() => setIsSuggesting(true)}>
                <Icon name="auto_awesome" size={14} />
                Sugestões
              </button>
          </>
        }
      />

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
    </>
  )
}
