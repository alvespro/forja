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
import { NutritionPreviewCard } from '@/components/today/nutrition-preview-card'
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { ProtocolSummaryCard } from '@/components/today/protocol-summary-card'
import { PullToRefresh } from '@/components/today/pull-to-refresh'
import { QuickStatsCard } from '@/components/today/quick-stats-card'
import { SpacedReviewCard } from '@/components/today/spaced-review-card'
import { WorkoutTodayCard } from '@/components/today/workout-today-card'

/**
 * Hoje — cockpit. Uma informação dominante por seção, espaço generoso entre elas:
 * hero (score) → ação principal → hábitos → métricas → semana/conquistas →
 * calendário → nutrição → alertas → demais resumos.
 */
export function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PullToRefresh />
      <GamifiedDashboard
        afterHero={
          <>
            <NextActionCard />
            <HabitChecklistCard />
            <QuickStatsCard />
          </>
        }
      />

      <ActivityCalendar />

      <NutritionPreviewCard />

      <AlertsSection>
        <NotificationsCard />
        <CycleEndAlertCard />
        <PretreinoAlertCard />
      </AlertsSection>

      {/* Demais resumos do dia — cada card se oculta quando não tem conteúdo */}
      <div className="flex flex-col gap-4">
        <WorkoutTodayCard />
        <FrogTaskCard />
        <ProtocolSummaryCard />
        <MoodCheckinCard />
        <CrmActionsCard />
        <SpacedReviewCard />
        <DevSummaryCard />
        <CycleProgressCard />
        <DietAdequacyCard collapsible />
      </div>
    </div>
  )
}
