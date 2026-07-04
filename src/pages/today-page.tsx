import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { CrmActionsCard } from '@/components/today/crm-actions-card'
import { CycleEndAlertCard } from '@/components/today/cycle-end-alert-card'
import { CycleProgressCard } from '@/components/today/cycle-progress-card'
import { FrogTaskCard } from '@/components/today/frog-task-card'
import { GamifiedDashboard } from '@/components/today/gamified-dashboard'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { MoodCheckinCard } from '@/components/today/mood-checkin-card'
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { WorkoutTodayCard } from '@/components/today/workout-today-card'
import { DevSummaryCard } from '@/components/today/dev-summary-card'
import { NotificationsCard } from '@/components/today/notifications-card'
import { ProtocolSummaryCard } from '@/components/today/protocol-summary-card'
import { SpacedReviewCard } from '@/components/today/spaced-review-card'

export function TodayPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ObjectiveBadge />
      </div>

      <GamifiedDashboard />

      <NotificationsCard />
      <CrmActionsCard />
      <CycleEndAlertCard />
      <CycleProgressCard />
      <WorkoutTodayCard />
      <DietAdequacyCard collapsible />
      <PretreinoAlertCard />
      <ProtocolSummaryCard />
      <SpacedReviewCard />
      <DevSummaryCard />
      <FrogTaskCard />
      <HabitChecklistCard />
      <MoodCheckinCard />
    </div>
  )
}
