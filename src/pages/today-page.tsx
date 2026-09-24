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
import { SecondBrainCard } from '@/components/today/second-brain-card'
import { SpacedReviewCard } from '@/components/today/spaced-review-card'
import { FlashcardsReviewCard } from '@/components/today/flashcards-review-card'

/**
 * Hoje — dashboard estilo Aaru sobre Liquid Glass:
 * 1 hero → 2 decisão do momento (saúde + ação) → 3 agenda → 4 corpo e treino →
 * 5 segundo cérebro → hábitos e resumos. O conteúdo acompanha o ritmo do dia, não os módulos.
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
            <section className="flex flex-col gap-3" aria-labelledby="today-now-title">
              <div>
                <h2 id="today-now-title" className="text-[19px] font-bold tracking-[-0.02em] text-nevoa">O que importa agora</h2>
                <p className="mt-1 text-[13px] text-cinza">Confira sua recuperação e escolha o próximo passo.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                <RecoveryRingCard />
                <NextActionCard />
              </div>
            </section>
            <AgendaTodayCard />
            {/* Pergunta de sono/disposição (some quando o score do dia existe; volta tocando no anel). */}
            <RecoveryCard />
            <section className="flex flex-col gap-3" aria-labelledby="today-progress-title">
              <div>
                <h2 id="today-progress-title" className="text-[19px] font-bold tracking-[-0.02em] text-nevoa">Seu progresso</h2>
                <p className="mt-1 text-[13px] text-cinza">Medidas registradas e alimentação de hoje.</p>
              </div>
              <QuickStatsCard />
              <NutritionTodayCard />
            </section>
            <SecondBrainCard />
            <HabitChecklistCard />
            <ActivityCalendar />
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
