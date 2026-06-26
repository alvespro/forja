import { Card, CardContent } from '@/components/ui/card'
import type { Habit } from '@/types/database'
import { parseDateOnly } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type HabitWeekCardProps = {
  habit: Habit
  completedDates: Set<string>
  weekDates: string[]
  today: string
  onToggle: (date: string, completed: boolean) => void
}

export function HabitWeekCard({
  habit,
  completedDates,
  weekDates,
  today,
  onToggle,
}: HabitWeekCardProps) {
  const streak = calculateStreak(completedDates, today)
  const diasDecorridos = weekDates.filter((d) => d <= today).length
  const concluidosNaSemana = weekDates.filter((d) => completedDates.has(d)).length
  const percentualSemana =
    diasDecorridos > 0 ? Math.round((concluidosNaSemana / diasDecorridos) * 100) : 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-foreground">{habit.nome}</span>
          {streak > 0 && (
            <span className="shrink-0 font-mono text-xs text-aco-texto">🔥 {streak}</span>
          )}
        </div>

        <div className="flex gap-1.5">
          {weekDates.map((date, i) => {
            const isFuture = date > today
            const isDone = completedDates.has(date)

            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                onClick={() => onToggle(date, !isDone)}
                aria-label={`${WEEKDAY_LABELS[i]}, dia ${parseDateOnly(date).getDate()}, ${isDone ? 'concluído' : 'não concluído'}`}
                aria-pressed={isDone}
                className={cn(
                  'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md py-2 text-[11px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isFuture && 'cursor-not-allowed opacity-40',
                  !isFuture &&
                    (isDone
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'),
                )}
              >
                <span>{WEEKDAY_LABELS[i]}</span>
                <span className="font-mono">{parseDateOnly(date).getDate()}</span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-aco-texto">
          {concluidosNaSemana}/{diasDecorridos} esta semana ({percentualSemana}%)
        </p>
      </CardContent>
    </Card>
  )
}
