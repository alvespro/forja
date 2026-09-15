import { ActivityCalendar } from '@/components/ActivityCalendar'
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
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { ProtocolSummaryCard } from '@/components/today/protocol-summary-card'
import { PullToRefresh } from '@/components/today/pull-to-refresh'
import { QuickStatsCard } from '@/components/today/quick-stats-card'
import { RecoveryCard } from '@/components/today/recovery-card'
import { SpacedReviewCard } from '@/components/today/spaced-review-card'
import { StatusBar } from '@/components/today/status-bar'
import { TodayGrid } from '@/components/today/today-grid'

/**
 * Hoje — cockpit estilo DeerFlow. Seções numeradas:
 * 0 status bar → 1 hero (score) → 2 métricas rápidas → 3 ação principal →
 * 4 hábitos → 5 grade (recuperação, nutrição, treino, pesagem) → nível/semana →
 * 6 calendário → 7 alertas → demais resumos.
 */
export function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <StatusBar />
      <GamifiedDashboard
        afterHero={
          <>
            <QuickStatsCard />
            {/* Pergunta de sono/disposição (some quando o score do dia existe; volta pelo tile Recovery). */}
            <RecoveryCard />
            <NextActionCard />
            <HabitChecklistCard />
            <TodayGrid />
          </>
        }
      />

      <ActivityCalendar />

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
        <SpacedReviewCard />
        <DevSummaryCard />
        <CycleProgressCard />
        <DietAdequacyCard collapsible />
      </div>

      {/* Fixo na tela: fica no fim para não somar gap no fluxo. */}
      <PullToRefresh />
    </div>
  )
}
