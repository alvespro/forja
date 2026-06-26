import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'

import { CycleProgressCard } from '@/components/today/cycle-progress-card'
import { FrogTaskCard } from '@/components/today/frog-task-card'
import { HabitChecklistCard } from '@/components/today/habit-checklist-card'
import { MoodCheckinCard } from '@/components/today/mood-checkin-card'
import { parseDateOnly, todayInSaoPaulo } from '@/lib/date'

export function TodayPage() {
  const today = todayInSaoPaulo()
  const dataFormatada = format(parseDateOnly(today), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Hoje</h1>
        <p className="text-sm capitalize text-aco-texto">{dataFormatada}</p>
      </div>

      <CycleProgressCard />
      <FrogTaskCard />
      <HabitChecklistCard />
      <MoodCheckinCard />
    </div>
  )
}
