import { ActivityCalendar } from '@/components/ActivityCalendar'
import { AgendaTodayCard } from '@/components/today/agenda-today-card'
import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { AlertsSection } from '@/components/today/alerts-section'
import { CrmActionsCard } from '@/components/today/crm-actions-card'
import { CycleEndAlertCard } from '@/components/today/cycle-end-alert-card'
import { CycleProgressCard } from '@/components/today/cycle-progress-card'
import { DevSummaryCard } from '@/components/today/dev-summary-card'
import { FrogTaskCard } from '@/components/today/frog-task-card'
import { GamifiedDashboard } from '@/components/today/gamified-dashboard'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { MoodCheckinCard } from '@/components/today/mood-checkin-card'
import { NextActionCard } from '@/components/today/next-action-card'
import { NotificationsCard } from '@/components/today/notifications-card'
import { NutritionTodayCard } from '@/components/today/nutrition-today-card'
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { ProtocolSummaryCard } from '@/components/today/protocol-summary-card'
import { PullToRefresh } from '@/components/today/pull-to-refresh'
import { QuickStatsCard } from '@/components/today/quick-stats-card'
import { ProtocolCycleCard } from '@/components/today/protocol-cycle-card'
import { RecoveryCard } from '@/components/today/recovery-card'
import { RecoveryRingCard } from '@/components/today/recovery-ring-card'
import { SpacedReviewCard } from '@/components/today/spaced-review-card'
import { FlashcardsReviewCard } from '@/components/today/flashcards-review-card'

/**
 * Hoje — dashboard estilo Aaru sobre Liquid Glass:
 * 1 hero (saudação + score) → 2 recuperação | próxima ação → 3 hábitos →
 * 4 métricas → 5 nutrição → 6 calendário → nível/semana → alertas → demais resumos.
 */
export function TodayPage() {
  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Brilho vermilion sutil atrás do hero, sobre o fundo preto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-4 -top-6 h-[420px] md:-inset-x-8"
        style={{ background: 'var(--gradient-hero)' }}
      />

      <GamifiedDashboard
        afterHero={
          <>
            {/* Ciclo do protocolo: no dia de aplicação é a prioridade do dia. */}
            <ProtocolCycleCard />
            <section className="grid grid-cols-2 gap-2" aria-label="Recuperação e próxima ação">
              <RecoveryRingCard />
              <NextActionCard />
            </section>
            {/* Pergunta de sono/disposição (some quando o score do dia existe; volta tocando no anel). */}
            <RecoveryCard />
            <HabitChecklistCard />
            <QuickStatsCard />
            <NutritionTodayCard />
            <ActivityCalendar />
            <AgendaTodayCard />
          </>
        }
      />

      <AlertsSection>
        <NotificationsCard />
        <CycleEndAlertCard />
        <PretreinoAlertCard />
      </AlertsSection>

      {/* Demais resumos do dia — cada card se oculta quando não tem conteúdo */}
      <div className="flex flex-col gap-4">
        <FrogTaskCard />
        <ProtocolSummaryCard />
        <MoodCheckinCard />
        <CrmActionsCard />
        <FlashcardsReviewCard />
        <SpacedReviewCard />
        <DevSummaryCard />
        <CycleProgressCard />
        <DietAdequacyCard collapsible />
      </div>

      <PullToRefresh />
    </div>
  )
}
