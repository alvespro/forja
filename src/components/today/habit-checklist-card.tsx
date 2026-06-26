import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { groupLogsByHabit, useHabitLogs, useHabits, useToggleHabitLog } from '@/hooks/use-habits'
import { todayInSaoPaulo } from '@/lib/date'
import { calculateStreak } from '@/lib/streak'
import { cn } from '@/lib/utils'

export function HabitChecklistCard() {
  const today = todayInSaoPaulo()
  const habits = useHabits()
  const logs = useHabitLogs()
  const toggle = useToggleHabitLog()

  const isLoading = habits.isLoading || logs.isLoading
  const isError = habits.isError || logs.isError

  const logsByHabit = groupLogsByHabit(logs.data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hábitos do dia</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            message="Não foi possível carregar os hábitos."
            onRetry={() => {
              habits.refetch()
              logs.refetch()
            }}
          />
        ) : !habits.data || habits.data.length === 0 ? (
          <EmptyState message="Nenhum hábito cadastrado ainda." />
        ) : (
          <ul className="flex flex-col gap-1">
            {habits.data.map((habit) => {
              const completedDates = logsByHabit.get(habit.id) ?? new Set<string>()
              const isDone = completedDates.has(today)
              const streak = calculateStreak(completedDates, today)

              return (
                <li key={habit.id}>
                  <button
                    type="button"
                    onClick={() =>
                      toggle.mutate({ habitId: habit.id, date: today, completed: !isDone })
                    }
                    className="flex w-full items-center gap-3 rounded-md p-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                        isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                      aria-hidden="true"
                    >
                      {isDone && '✓'}
                    </span>
                    <span className={cn('flex-1', isDone && 'text-muted-foreground')}>
                      {habit.nome}
                    </span>
                    {streak > 0 && (
                      <span className="font-mono text-xs text-aco-texto">🔥 {streak}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
