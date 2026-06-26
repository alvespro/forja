import { HabitWeekCard } from '@/components/habits/habit-week-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { groupLogsByHabit, useHabitLogs, useHabits, useToggleHabitLog } from '@/hooks/use-habits'
import { currentIsoWeekDates, todayInSaoPaulo } from '@/lib/date'

export function HabitsPage() {
  const habits = useHabits()
  const logs = useHabitLogs()
  const toggle = useToggleHabitLog()

  const today = todayInSaoPaulo()
  const weekDates = currentIsoWeekDates()
  const isLoading = habits.isLoading || logs.isLoading
  const isError = habits.isError || logs.isError
  const logsByHabit = groupLogsByHabit(logs.data)

  const diasDecorridos = weekDates.filter((d) => d <= today).length
  let totalConcluido = 0
  let totalPossivel = 0

  if (habits.data) {
    for (const habit of habits.data) {
      const completedDates = logsByHabit.get(habit.id) ?? new Set<string>()
      totalConcluido += weekDates.filter((d) => completedDates.has(d)).length
      totalPossivel += diasDecorridos
    }
  }

  const percentualGeral = totalPossivel > 0 ? Math.round((totalConcluido / totalPossivel) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Hábitos</h1>
        <p className="text-sm text-aco-texto">Grade semanal, streaks e consistência.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Esta semana</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl text-foreground">{percentualGeral}%</span>
                <span className="text-xs text-aco-texto">
                  {totalConcluido}/{totalPossivel} check-ins
                </span>
              </div>
              <Progress value={percentualGeral} />
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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
        <div className="flex flex-col gap-3">
          {habits.data.map((habit) => (
            <HabitWeekCard
              key={habit.id}
              habit={habit}
              completedDates={logsByHabit.get(habit.id) ?? new Set<string>()}
              weekDates={weekDates}
              today={today}
              onToggle={(date, completed) =>
                toggle.mutate({ habitId: habit.id, date, completed })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
