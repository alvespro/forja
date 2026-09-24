import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { FoodSearch } from '@/components/FoodSearch'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { MacroBar } from '@/components/ds/macro-bar'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ds/status-dot'
import { FoodBodyChart } from '@/components/nutrition/food-body-chart'
import { NovaRefeicaoButton, PlanoAlimentarModal } from '@/components/nutrition/dieta-crud'
import { MealSlotCard } from '@/components/nutrition/meal-slot-card'
import { RegisteredMealLogs } from '@/components/nutrition/registered-meal-logs'
import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { SupplementsTodaySection } from '@/components/nutrition/supplements-today-section'
import { useActiveDietPlan, useMealSlots } from '@/hooks/use-diet-plan'
import { useMealLogsToday } from '@/hooks/use-meal-logs'
import { useSystemStatus } from '@/hooks/use-system-status'
import { nowMinutesInSaoPaulo } from '@/lib/date'
import { classifyMeals } from '@/lib/meal-schedule'
import { cn } from '@/lib/utils'
import type { MealLog } from '@/types/database'

export function NutricaoPage() {
  const dietPlan = useActiveDietPlan()
  const mealSlots = useMealSlots(dietPlan.data?.id)
  const mealLogs = useMealLogsToday()
  const systemStatus = useSystemStatus()
  const [showSupps, setShowSupps] = useState(false)
  const [summaryCompact, setSummaryCompact] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState(false)

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
  const slotIds = new Set(slots.map((slot) => slot.id))
  const logsSemRefeicao = (mealLogs.data ?? []).filter((log) => !log.meal_slot_id || !slotIds.has(log.meal_slot_id))
  const currentSlot = slots.find((s) => s.id === timing.currentId) ?? null

  const isLoading = dietPlan.isLoading || mealSlots.isLoading || mealLogs.isLoading
  const isError = dietPlan.isError || mealSlots.isError || mealLogs.isError

  // Refeição = slot com pelo menos um alimento; lançamento sem slot conta sozinho.
  const refeicoesHoje = useMemo(() => {
    const logs = mealLogs.data ?? []
    return new Set(logs.map((l) => l.meal_slot_id ?? l.id)).size
  }, [mealLogs.data])

  const agoraNumero = currentSlot?.numero ?? 0
  const kcalMeta = dietPlan.data?.calorias_alvo ?? 0
  const sync = systemStatus.estado === 'offline'
    ? { color: 'cinza' as const, label: 'Offline' }
    : systemStatus.estado === 'falhas'
      ? { color: 'alerta' as const, label: 'Falha ao sincronizar' }
      : mealLogs.isFetching
        ? { color: 'brasa' as const, label: 'Sincronizando' }
        : { color: 'ok' as const, label: 'Sincronizado' }

  useEffect(() => {
    const updateSummary = () => setSummaryCompact(window.scrollY > 120)
    updateSummary()
    window.addEventListener('scroll', updateSummary, { passive: true })
    return () => window.removeEventListener('scroll', updateSummary)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="ds-h1 text-foreground">Nutrição</h1>
          <ObjectiveBadge />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {dietPlan.data?.nome && <p className="ds-body-sm text-aco-texto">{dietPlan.data.nome}</p>}
          {!isLoading && !isError && (
            <button type="button" onClick={() => setEditandoPlano(true)} className="ds-btn-ghost min-h-11 px-3 text-[13px]">
              <Icon name="settings" size={18} />
              Plano alimentar
            </button>
          )}
        </div>
      </header>
      <PlanoAlimentarModal open={editandoPlano} plano={dietPlan.data ?? null} onClose={() => setEditandoPlano(false)} />

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
        <>
          <EmptyState
            message="Nenhum plano alimentar ativo"
            description="Cadastre um plano para acompanhar macros e refeições."
            action={<Button type="button" onClick={() => setEditandoPlano(true)}>Criar plano alimentar</Button>}
          />
          <RegisteredMealLogs logs={mealLogs.data ?? []} slots={[]} heading="Alimentos registrados hoje" />
        </>
      ) : (
        <>
          {/* HEADER FIXO: macros do dia em destaque */}
          <section className={cn(
            'sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 flex flex-col border-b border-linha bg-fundo/90 px-4 backdrop-blur-[20px] transition-[padding,gap] duration-200 motion-reduce:transition-none md:mx-0 md:rounded-[var(--r-md)] md:border md:px-5',
            summaryCompact ? 'gap-2 py-2' : 'gap-3 pb-4 pt-3',
          )}>
            {!summaryCompact && (
              <div className="flex items-center justify-between gap-3">
                <span className="ds-label">Resumo de hoje</span>
                <StatusDot
                  color={sync.color}
                  pulse={mealLogs.isFetching}
                  label={sync.label}
                  colorLabel
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[18px] font-bold uppercase text-nevoa [font-family:var(--font-display)] tabular-nums">
                  {Math.round(consumido.calorias).toLocaleString('pt-BR')}
                  <span className="font-normal text-cinza"> / {kcalMeta.toLocaleString('pt-BR')} kcal</span>
                </span>
                <span className={cn('ds-body-sm text-cinza', summaryCompact && 'sr-only')}>
                  {refeicoesHoje === 0
                    ? 'Nenhuma refeição registrada hoje'
                    : `${refeicoesHoje} ${refeicoesHoje === 1 ? 'refeição registrada' : 'refeições registradas'} hoje`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBuscando(true)}
                className="ds-btn-primary shrink-0 px-4 text-[13px]"
              >
                <Icon name="add" size={16} />
                Registrar alimento
              </button>
            </div>
            {!summaryCompact && (
              <MacroBar
                size="lg"
                proteina={{ atual: consumido.proteina_g, meta: dietPlan.data.proteina_g ?? 0 }}
                carbo={{ atual: consumido.carbo_g, meta: dietPlan.data.carbo_g ?? 0 }}
                gordura={{ atual: consumido.gordura_g, meta: dietPlan.data.gordura_g ?? 0 }}
              />
            )}
          </section>

          {logsSemRefeicao.length > 0 && (
            <RegisteredMealLogs logs={logsSemRefeicao} slots={slots} heading="Alimentos sem refeição do plano" />
          )}

          {slots.length === 0 ? (
            <>
              <EmptyState message="Nenhuma refeição no plano" description="Adicione as refeições do plano ativo." />
              <NovaRefeicaoButton dietPlanId={dietPlan.data.id} total={0} />
            </>
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
                <NovaRefeicaoButton dietPlanId={dietPlan.data.id} total={slots.length} />
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
                <Icon name="expand_more" size={20} className={cn('size-5 text-aco-texto transition-transform', showSupps && 'rotate-180')} />
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

          <FoodSearch open={buscando} onClose={() => setBuscando(false)} slots={slots} defaultSlotId={currentSlot?.id ?? null} />
        </>
      )}
    </div>
  )
}
