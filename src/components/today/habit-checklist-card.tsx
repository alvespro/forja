import { Check } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { groupLogsByHabit, useHabitLogs, useHabits, useToggleHabitLog } from '@/hooks/use-habits'
import { todayInSaoPaulo } from '@/lib/date'
import { haptic } from '@/lib/haptics'
import { calculateStreak } from '@/lib/streak'
import { cn } from '@/lib/utils'

/**
 * SECTION 3 do cockpit: hábitos em linha horizontal (círculos de 48px),
 * toque alterna com feedback háptico; todos feitos → celebração.
 */
export function HabitChecklistCard() {
  const today = todayInSaoPaulo()
  const habits = useHabits()
  const logs = useHabitLogs()
  const toggle = useToggleHabitLog()

  const isLoading = habits.isLoading || logs.isLoading
  const isError = habits.isError || logs.isError
  const logsByHabit = groupLogsByHabit(logs.data)

  const lista = habits.data ?? []
  const feitos = lista.filter((h) => logsByHabit.get(h.id)?.has(today)).length
  const todosFeitos = lista.length > 0 && feitos === lista.length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="ds-label">Hábitos</span>
        {lista.length > 0 && (
          <span
            key={todosFeitos ? 'completo' : 'parcial'}
            className={cn('ds-data-md', todosFeitos ? 'ds-celebrate font-bold text-brasa' : 'text-aco-texto')}
          >
            {feitos}/{lista.length} hoje{todosFeitos && ' 🔥'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os hábitos."
          onRetry={() => {
            habits.refetch()
            logs.refetch()
          }}
        />
      ) : lista.length === 0 ? (
        <EmptyState message="Nenhum hábito ainda" description="Hábitos diários somam pontos no FORJA Score." />
      ) : (
        <ul className="ds-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {lista.map((habit) => {
            const completedDates = logsByHabit.get(habit.id) ?? new Set<string>()
            const isDone = completedDates.has(today)
            const streak = calculateStreak(completedDates, today)

            return (
              <li key={habit.id} className="w-16 shrink-0">
                <button
                  type="button"
                  aria-pressed={isDone}
                  aria-label={`${habit.nome}${isDone ? ', feito' : ''}`}
                  onClick={() => {
                    haptic('light')
                    toggle.mutate({ habitId: habit.id, date: today, completed: !isDone })
                  }}
                  className="flex w-full flex-col items-center gap-1.5 outline-none focus-visible:[&>span:nth-child(2)]:ring-2 focus-visible:[&>span:nth-child(2)]:ring-ring"
                >
                  <span className={cn('h-3.5 ds-data-sm', streak > 0 ? 'text-brasa' : 'text-transparent')}>
                    🔥{streak}
                  </span>
                  <span
                    className={cn(
                      'ds-pressable flex size-12 items-center justify-center rounded-full border-2',
                      isDone ? 'border-brasa bg-brasa text-meia-noite' : 'border-linha bg-aco text-transparent',
                    )}
                    style={{ transition: 'background-color var(--dur-normal) var(--spring-bounce), transform var(--dur-fast) var(--spring-bounce)' }}
                  >
                    <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className={cn('w-full truncate text-center text-[10px] leading-tight', isDone ? 'text-foreground' : 'text-aco-texto')}>
                    {habit.nome}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
