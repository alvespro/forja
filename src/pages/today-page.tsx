import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'

import { DietAdequacyCard } from '@/components/body/diet-adequacy-card'
import { ObjectiveBadge } from '@/components/body/objective-badge'
import { CycleEndAlertCard } from '@/components/today/cycle-end-alert-card'
import { CycleProgressCard } from '@/components/today/cycle-progress-card'
import { FrogTaskCard } from '@/components/today/frog-task-card'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { MoodCheckinCard } from '@/components/today/mood-checkin-card'
import { PretreinoAlertCard } from '@/components/today/pretreino-alert-card'
import { WorkoutTodayCard } from '@/components/today/workout-today-card'
import { DevSummaryCard } from '@/components/today/dev-summary-card'
import { ProtocolSummaryCard } from '@/components/today/protocol-summary-card'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'

export function TodayPage() {
  const today = todayInSaoPaulo()
  const dataFormatada = format(parseDateOnly(today), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Hoje</h1>
          <p className="text-sm capitalize text-aco-texto">{dataFormatada}</p>
        </div>
        <ObjectiveBadge />
      </div>

      <CycleEndAlertCard />
      <CycleProgressCard />
      <WorkoutTodayCard />
      <DietAdequacyCard collapsible />
      <PretreinoAlertCard />
      <ProtocolSummaryCard />
      <DevSummaryCard />
      <FrogTaskCard />
      <HabitChecklistCard />
      <MoodCheckinCard />
    </div>
  )
}
