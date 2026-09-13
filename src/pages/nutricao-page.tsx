import { useMemo, useState } from 'react'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { DailySummaryBar } from '@/components/nutrition/daily-summary-bar'
import { FoodBodyChart } from '@/components/nutrition/food-body-chart'
import { MealSlotCard } from '@/components/nutrition/meal-slot-card'
import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { SupplementsTodaySection } from '@/components/nutrition/supplements-today-section'
import { useActiveDietPlan, useMealSlots } from '@/hooks/use-diet-plan'
import { useMealLogsToday } from '@/hooks/use-meal-logs'
import { useLastYazioSync, useSyncYazioNow } from '@/hooks/use-yazio-sync'
import { nowMinutesInSaoPaulo, parseDateOnly } from '@/lib/date'
import { classifyMeals } from '@/lib/meal-schedule'
import { cn } from '@/lib/utils'
import type { MealLog } from '@/types/database'

export function NutricaoPage() {
  const dietPlan = useActiveDietPlan()
  const mealSlots = useMealSlots(dietPlan.data?.id)
  const mealLogs = useMealLogsToday()
  const lastSync = useLastYazioSync()
  const syncNow = useSyncYazioNow()
  const [showSupps, setShowSupps] = useState(true)

  const consumido = useMemo(() => {
    const logs = mealLogs.data ?? []
    return logs.reduce(
      (acc, log) => ({
        calorias: acc.calorias + (log.calorias ?? 0),
        proteina_g: acc.proteina_g + (log.proteina_g ?? 0),
        carbo_g: acc.carbo_g + (log.carbo_g ?? 0),
        gordura_g: acc.gordura_g + (log.gordura_g ?? 0),
      }),
      { calorias: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0 },
    )
  }, [mealLogs.data])

  const logsBySlot = useMemo(() => {
    const map = new Map<string, MealLog[]>()
    for (const log of mealLogs.data ?? []) {
      if (!log.meal_slot_id) continue
      const list = map.get(log.meal_slot_id) ?? []
      list.push(log)
      map.set(log.meal_slot_id, list)
    }
    return map
  }, [mealLogs.data])

  const timing = useMemo(
    () => classifyMeals(mealSlots.data ?? [], nowMinutesInSaoPaulo()),
    [mealSlots.data],
  )

  const slots = mealSlots.data ?? []
  const currentSlot = slots.find((s) => s.id === timing.currentId) ?? null
  const nextSlot = slots.find((s) => s.id === timing.nextId) ?? null
  const otherSlots = slots.filter((s) => s.id !== timing.currentId && s.id !== timing.nextId)

  const isLoading = dietPlan.isLoading || mealSlots.isLoading || mealLogs.isLoading
  const isError = dietPlan.isError || mealSlots.isError || mealLogs.isError

  const yazioStatus = lastSync.isLoading
    ? 'Yazio…'
    : !lastSync.data
      ? 'Yazio: nunca'
      : lastSync.data.status === 'sucesso'
        ? `✅ ${isToday(new Date(lastSync.data.created_at)) ? 'hoje' : format(parseDateOnly(lastSync.data.data), 'dd/MM')} ${format(new Date(lastSync.data.created_at), 'HH:mm')}`
        : `⚠️ ${format(new Date(lastSync.data.created_at), 'dd/MM HH:mm', { locale: ptBR })}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Nutrição 🥗</h1>
          <p className="text-sm text-aco-texto">{dietPlan.data?.nome ?? 'Plano alimentar e suplementação'}</p>
        </div>
        <ObjectiveBadge />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os dados de nutrição."
          onRetry={() => {
            dietPlan.refetch()
            mealSlots.refetch()
            mealLogs.refetch()
          }}
        />
      ) : !dietPlan.data ? (
        <EmptyState message="Nenhum plano alimentar ativo ainda." />
      ) : (
        <>
          {/* HEADER FIXO: macros do dia + refeição atual + status Yazio */}
          <div className="sticky top-0 z-20 flex flex-col gap-2 bg-background/95 pb-1 pt-1 backdrop-blur">
            <DailySummaryBar
              calorias={{ label: 'Calorias', consumido: consumido.calorias, meta: dietPlan.data.calorias_alvo ?? 0, unidade: '' }}
              proteina={{ label: 'Proteína', consumido: consumido.proteina_g, meta: dietPlan.data.proteina_g ?? 0, unidade: 'g' }}
              carbo={{ label: 'Carbo', consumido: consumido.carbo_g, meta: dietPlan.data.carbo_g ?? 0, unidade: 'g' }}
              gordura={{ label: 'Gordura', consumido: consumido.gordura_g, meta: dietPlan.data.gordura_g ?? 0, unidade: 'g' }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-aco-texto">
                Refeição atual:{' '}
                <span className="font-medium text-foreground">
                  {currentSlot ? `${currentSlot.nome} — ${currentSlot.horario_alvo?.slice(0, 5) ?? ''}` : '—'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-aco-texto">{yazioStatus}</span>
                <Button type="button" variant="outline" size="xs" disabled={syncNow.isPending} onClick={() => syncNow.mutate()}>
                  <RefreshCw className={syncNow.isPending ? 'size-3 animate-spin' : 'size-3'} aria-hidden="true" />
                  Sync
                </Button>
              </div>
            </div>
          </div>

          {slots.length === 0 ? (
            <EmptyState message="Nenhuma refeição configurada no plano ativo." />
          ) : (
            <div className="flex flex-col gap-3">
              {/* REFEIÇÃO EM DESTAQUE (AGORA) */}
              {currentSlot && (
                <MealSlotCard
                  slot={currentSlot}
                  logsHoje={logsBySlot.get(currentSlot.id) ?? []}
                  variant="featured"
                  allSlots={slots}
                />
              )}

              {/* PRÓXIMA REFEIÇÃO */}
              {nextSlot && (
                <MealSlotCard
                  slot={nextSlot}
                  logsHoje={logsBySlot.get(nextSlot.id) ?? []}
                  variant="next"
                  allSlots={slots}
                />
              )}

              {/* RESTANTE DO DIA */}
              {otherSlots.map((slot) => (
                <MealSlotCard
                  key={slot.id}
                  slot={slot}
                  logsHoje={logsBySlot.get(slot.id) ?? []}
                  allSlots={slots}
                />
              ))}
            </div>
          )}

          {/* SUPLEMENTAÇÃO (colapsável) */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowSupps((v) => !v)}
              aria-expanded={showSupps}
              className="flex min-h-11 items-center justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-heading text-lg font-semibold text-foreground">Suplementos de hoje</span>
              <ChevronDown className={cn('size-4 text-aco-texto transition-transform', showSupps && 'rotate-180')} aria-hidden="true" />
            </button>
            {showSupps && <SupplementsTodaySection />}
          </div>

          <DietAdequacyCard />
          <FoodBodyChart plan={dietPlan.data} />
        </>
      )}
    </div>
  )
}
