import { ActivityCalendar } from '@/components/ActivityCalendar'
import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { CrmActionsCard } from '@/components/today/crm-actions-card'
import { CycleEndAlertCard } from '@/components/today/cycle-end-alert-card'
import { CycleProgressCard } from '@/components/today/cycle-progress-card'
import { FrogTaskCard } from '@/components/today/frog-task-card'
import { GamifiedDashboard } from '@/components/today/gamified-dashboard'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { MoodCheckinCard } from '@/components/today/mood-checkin-card'
import { NextActionCard } from '@/components/today/next-action-card'
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { QuickStatsCard } from '@/components/today/quick-stats-card'
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

      {/* BLOCO 1 — FORJA Score */}
      <GamifiedDashboard />

      {/* BLOCO 2 — Próxima ação */}
      <NextActionCard />

      {/* Treino de hoje (ação central de execução) */}
      <WorkoutTodayCard />

      {/* BLOCO 3 — Hábitos do dia */}
      <HabitChecklistCard />

      {/* BLOCO 4 — Resumo rápido */}
      <QuickStatsCard />

      {/* BLOCO 5 — Calendário de atividades */}
      <ActivityCalendar />

      {/* Tarefa-sapo do dia */}
      <FrogTaskCard />

      {/* BLOCO 6 — Alertas e resumos pendentes (cada card se oculta quando não há nada) */}
      <NotificationsCard />
      <CycleEndAlertCard />
      <PretreinoAlertCard />
      <ProtocolSummaryCard />
      <DietAdequacyCard collapsible />
      <CrmActionsCard />
      <SpacedReviewCard />
      <DevSummaryCard />
      <CycleProgressCard />
      <MoodCheckinCard />
    </div>
  )
}
