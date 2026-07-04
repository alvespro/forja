import { useMemo } from 'react'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RefreshCw } from 'lucide-react'

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
import { parseDateOnly } from '@/lib/date'

export function NutricaoPage() {
  const dietPlan = useActiveDietPlan()
  const mealSlots = useMealSlots(dietPlan.data?.id)
  const mealLogs = useMealLogsToday()
  const lastSync = useLastYazioSync()
  const syncNow = useSyncYazioNow()

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
    const map = new Map<string, typeof mealLogs.data>()
    for (const log of mealLogs.data ?? []) {
      if (!log.meal_slot_id) continue
      const list = map.get(log.meal_slot_id) ?? []
      list.push(log)
      map.set(log.meal_slot_id, list)
    }
    return map
  }, [mealLogs.data])

  const isLoading = dietPlan.isLoading || mealSlots.isLoading || mealLogs.isLoading
  const isError = dietPlan.isError || mealSlots.isError || mealLogs.isError

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Nutrição 🥗</h1>
          <p className="text-sm text-aco-texto">{dietPlan.data?.nome ?? 'Plano alimentar e suplementação'}</p>
        </div>
        <ObjectiveBadge />
      </div>

      <DietAdequacyCard />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
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
          <DailySummaryBar
            calorias={{ label: 'Calorias', consumido: consumido.calorias, meta: dietPlan.data.calorias_alvo ?? 0, unidade: '' }}
            proteina={{ label: 'Proteína', consumido: consumido.proteina_g, meta: dietPlan.data.proteina_g ?? 0, unidade: 'g' }}
            carbo={{ label: 'Carbo', consumido: consumido.carbo_g, meta: dietPlan.data.carbo_g ?? 0, unidade: 'g' }}
            gordura={{ label: 'Gordura', consumido: consumido.gordura_g, meta: dietPlan.data.gordura_g ?? 0, unidade: 'g' }}
          />

          <FoodBodyChart plan={dietPlan.data} />

          {!mealSlots.data || mealSlots.data.length === 0 ? (
            <EmptyState message="Nenhuma refeição configurada no plano ativo." />
          ) : (
            <div className="flex flex-col gap-3">
              {mealSlots.data.map((slot) => (
                <MealSlotCard key={slot.id} slot={slot} logsHoje={logsBySlot.get(slot.id) ?? []} />
              ))}
            </div>
          )}
        </>
      )}

      <div>
        <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">Suplementação hoje</h2>
        <SupplementsTodaySection />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-aco-texto">
        <span>
          {lastSync.isLoading
            ? 'Carregando status do Yazio…'
            : !lastSync.data
              ? 'Nenhuma sincronização com o Yazio ainda.'
              : lastSync.data.status === 'sucesso'
                ? `✅ Sync Yazio: ${isToday(new Date(lastSync.data.created_at)) ? 'hoje' : format(parseDateOnly(lastSync.data.data), 'dd/MM')} às ${format(new Date(lastSync.data.created_at), 'HH:mm')} — ${lastSync.data.registros_importados} refeiç${lastSync.data.registros_importados === 1 ? 'ão' : 'ões'}`
                : `⚠️ Último sync: ${format(new Date(lastSync.data.created_at), 'dd/MM')} às ${format(new Date(lastSync.data.created_at), 'HH:mm', { locale: ptBR })}`}
        </span>
        <Button type="button" variant="outline" size="xs" disabled={syncNow.isPending} onClick={() => syncNow.mutate()}>
          <RefreshCw className={syncNow.isPending ? 'size-3 animate-spin' : 'size-3'} aria-hidden="true" />
          {syncNow.isPending ? 'Sincronizando…' : 'Sincronizar agora'}
        </Button>
      </div>
    </div>
  )
}
