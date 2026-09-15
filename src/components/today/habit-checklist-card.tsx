import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { groupLogsByHabit, useHabitLogs, useHabits, useToggleHabitLog } from '@/hooks/use-habits'
import { useRecoveryGate } from '@/hooks/use-recovery-gate'
import { todayInSaoPaulo } from '@/lib/date'
import { haptic } from '@/lib/haptics'
import { ehHabitoDeMovimento } from '@/lib/mobility'
import { calculateStreak } from '@/lib/streak'
import { cn } from '@/lib/utils'

/**
 * SECTION 4 do cockpit: hábitos em linha horizontal (círculos de 52px),
 * toque alterna com feedback háptico; todos feitos → celebração. "Mover o corpo"
 * abre a ativação matinal (treino de hoje + 5 min de mobilidade) em vez de só marcar.
 */
export function HabitChecklistCard() {
  const today = todayInSaoPaulo()
  const habits = useHabits()
  const logs = useHabitLogs()
  const toggle = useToggleHabitLog()
  const navigate = useNavigate()
  const { treinoDeHoje } = useRecoveryGate()
  const [movimentoAberto, setMovimentoAberto] = useState(false)

  const isLoading = habits.isLoading || logs.isLoading
  const isError = habits.isError || logs.isError
  const logsByHabit = groupLogsByHabit(logs.data)

  const lista = habits.data ?? []
  const feitos = lista.filter((h) => logsByHabit.get(h.id)?.has(today)).length
  const todosFeitos = lista.length > 0 && feitos === lista.length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="ds-label whitespace-pre">
          <span className="text-cinza2-texto">03</span>  Hábitos
        </span>
        {lista.length > 0 && (
          <span
            key={todosFeitos ? 'completo' : 'parcial'}
            className={cn('ds-data-md', todosFeitos ? 'ds-celebrate font-bold text-brasa' : 'text-cinza')}
          >
            {feitos}/{lista.length} hoje{todosFeitos && ' 🔥'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-[52px] rounded-full" />
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
              <li key={habit.id} className="w-[68px] shrink-0">
                <button
                  type="button"
                  aria-pressed={isDone}
                  aria-label={`${habit.nome}${isDone ? ', feito' : ''}`}
                  aria-expanded={ehHabitoDeMovimento(habit.nome) ? movimentoAberto : undefined}
                  onClick={() => {
                    haptic('light')
                    if (ehHabitoDeMovimento(habit.nome)) setMovimentoAberto((v) => !v)
                    else toggle.mutate({ habitId: habit.id, date: today, completed: !isDone })
                  }}
                  className="flex w-full flex-col items-center gap-1.5 outline-none focus-visible:[&>span:nth-child(2)]:ring-2 focus-visible:[&>span:nth-child(2)]:ring-ring"
                >
                  <span className={cn('ds-terminal-xs h-4', streak > 0 ? 'text-brasa' : 'invisible')} aria-hidden={streak === 0}>
                    {streak}d
                  </span>
                  <span
                    className={cn(
                      'ds-pressable flex size-[52px] items-center justify-center rounded-full border',
                      isDone ? 'border-brasa bg-brasa text-nevoa shadow-[var(--shadow-brasa)]' : 'border-linha bg-aco text-transparent',
                    )}
                    style={{ transition: 'background-color var(--dur-normal) var(--spring-bounce), transform var(--dur-fast) var(--spring-bounce)' }}
                  >
                    <Check className="size-6" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className={cn('w-full truncate text-center text-[11px] leading-tight', isDone ? 'text-nevoa' : 'text-cinza')}>
                    {habit.nome}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {movimentoAberto &&
        (() => {
          const movimento = lista.find((h) => ehHabitoDeMovimento(h.nome))
          if (!movimento) return null
          const feito = logsByHabit.get(movimento.id)?.has(today) ?? false
          return (
            <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-linha bg-card p-4">
              <p className="ds-body-md text-foreground">💪 Treino de hoje: {treinoDeHoje ?? 'descanso'}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/workout')}
                  className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-linha px-5 ds-body-md font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  🏋️ Ir para o treino de hoje
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/mobilidade?rotina=manha&iniciar=1&habito=${movimento.id}`)}
                  className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  🧘 Fazer ativação de 5 min primeiro
                </button>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ habitId: movimento.id, date: today, completed: !feito })}
                  className="min-h-11 rounded-full px-3 ds-body-sm text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {feito ? 'Desmarcar hábito' : 'Já me movi — só marcar feito'}
                </button>
              </div>
            </div>
          )
        })()}
    </section>
  )
}
