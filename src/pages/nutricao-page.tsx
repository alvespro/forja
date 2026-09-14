import { useMemo, useState } from 'react'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, RefreshCw } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { MacroBar } from '@/components/ds/macro-bar'
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

  const isLoading = dietPlan.isLoading || mealSlots.isLoading || mealLogs.isLoading
  const isError = dietPlan.isError || mealSlots.isError || mealLogs.isError

  const yazioStatus = lastSync.isLoading
    ? 'Yazio…'
    : !lastSync.data
      ? 'Yazio: nunca'
      : lastSync.data.status === 'sucesso'
        ? `✅ ${isToday(new Date(lastSync.data.created_at)) ? 'hoje' : format(parseDateOnly(lastSync.data.data), 'dd/MM')} ${format(new Date(lastSync.data.created_at), 'HH:mm')}`
        : `⚠️ ${format(new Date(lastSync.data.created_at), 'dd/MM HH:mm', { locale: ptBR })}`

  const agoraNumero = currentSlot?.numero ?? 0
  const kcalMeta = dietPlan.data?.calorias_alvo ?? 0

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="ds-h1 text-foreground">Nutrição</h1>
          <ObjectiveBadge />
        </div>
        {dietPlan.data?.nome && <p className="ds-body-sm text-aco-texto">{dietPlan.data.nome}</p>}
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-44 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
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
        <EmptyState message="Nenhum plano alimentar ativo" description="Cadastre um plano para acompanhar macros e refeições." />
      ) : (
        <>
          {/* HEADER FIXO: macros do dia em destaque */}
          <section className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-linha bg-meia-noite/90 px-4 pb-4 pt-3 backdrop-blur-md md:mx-0 md:rounded-[var(--radius-lg)] md:border md:px-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[18px] font-bold text-foreground [font-family:var(--font-data)] tabular-nums">
                {Math.round(consumido.calorias).toLocaleString('pt-BR')}
                <span className="ds-data-md font-normal text-aco-texto"> / {kcalMeta.toLocaleString('pt-BR')} kcal</span>
              </span>
              <button
                type="button"
                onClick={() => syncNow.mutate()}
                disabled={syncNow.isPending}
                aria-label={`Sincronizar Yazio (${yazioStatus})`}
                className="-mr-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 ds-data-sm text-aco-texto outline-none hover:text-foreground disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw className={cn('size-3.5', syncNow.isPending && 'animate-spin')} aria-hidden="true" />
                {yazioStatus}
              </button>
            </div>
            <MacroBar
              size="lg"
              proteina={{ atual: consumido.proteina_g, meta: dietPlan.data.proteina_g ?? 0 }}
              carbo={{ atual: consumido.carbo_g, meta: dietPlan.data.carbo_g ?? 0 }}
              gordura={{ atual: consumido.gordura_g, meta: dietPlan.data.gordura_g ?? 0 }}
            />
          </section>

          {slots.length === 0 ? (
            <EmptyState message="Nenhuma refeição no plano" description="Configure as refeições do plano ativo." />
          ) : (
            <>
              {/* REFEIÇÃO ATUAL (hero) */}
              {currentSlot && (
                <section className="flex flex-col gap-2">
                  <MealSlotCard
                    slot={currentSlot}
                    logsHoje={logsBySlot.get(currentSlot.id) ?? []}
                    variant="featured"
                    allSlots={slots}
                  />
                </section>
              )}

              {/* DEMAIS REFEIÇÕES DO DIA — as que já passaram ficam esmaecidas */}
              <section className="flex flex-col gap-2">
                <span className="ds-label">Refeições do dia</span>
                {slots
                  .filter((s) => s.id !== currentSlot?.id)
                  .map((slot) => (
                    <MealSlotCard
                      key={slot.id}
                      slot={slot}
                      logsHoje={logsBySlot.get(slot.id) ?? []}
                      allSlots={slots}
                      passada={slot.numero < agoraNumero}
                    />
                  ))}
              </section>
            </>
          )}

          {/* SUPLEMENTOS (seção recolhível com alça) */}
          <section className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-linha bg-aco">
            <button
              type="button"
              onClick={() => setShowSupps((v) => !v)}
              aria-expanded={showSupps}
              className="flex flex-col items-center gap-2 px-4 pb-3 pt-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="h-1 w-10 rounded-full bg-aco-texto/40" aria-hidden="true" />
              <span className="flex min-h-9 w-full items-center justify-between">
                <span className="ds-h4 text-foreground">Suplementos de hoje</span>
                <ChevronDown className={cn('size-5 text-aco-texto transition-transform', showSupps && 'rotate-180')} aria-hidden="true" />
              </span>
            </button>
            {showSupps && (
              <div className="px-4 pb-4">
                <SupplementsTodaySection />
              </div>
            )}
          </section>

          <DietAdequacyCard />
          <FoodBodyChart plan={dietPlan.data} />
        </>
      )}
    </div>
  )
}
