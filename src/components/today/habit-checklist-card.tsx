import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { Skeleton } from '@/components/ui/skeleton'
import { groupLogsByHabit, useHabitLogs, useHabits, useToggleHabitLog } from '@/hooks/use-habits'
import { useRecoveryGate } from '@/hooks/use-recovery-gate'
import { todayInSaoPaulo } from '@/lib/date'
import { haptic } from '@/lib/haptics'
import { ehHabitoDeMovimento } from '@/lib/mobility'
import { calculateStreak } from '@/lib/streak'
import { cn } from '@/lib/utils'

/**
 * SECTION 3 do cockpit (lista de tarefas do Aaru): um hábito por linha, ícone que
 * se preenche ao marcar (com vibração leve) e streak em chip. "Mover o corpo"
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
    <GlassCard className="flex flex-col gap-2" padding="var(--s4) var(--s4) var(--s2)" aria-label="Hábitos de hoje">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Icon name="check_circle" size={18} className="text-cinza2" />
          <span className="ds-label">Hábitos de hoje</span>
        </span>
        {lista.length > 0 && (
          <span
            key={todosFeitos ? 'completo' : 'parcial'}
            className={cn('text-[12px] tabular-nums [font-family:var(--font-display)]', todosFeitos ? 'ds-celebrate font-bold text-brasa' : 'text-cinza')}
          >
            {feitos}/{lista.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-[var(--r-sm)]" />
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
        <div className="pb-2">
          <EmptyState message="Nenhum hábito ainda" description="Hábitos diários somam pontos no FORJA Score." />
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-linha">
          {lista.map((habit) => {
            const completedDates = logsByHabit.get(habit.id) ?? new Set<string>()
            const isDone = completedDates.has(today)
            const streak = calculateStreak(completedDates, today)
            const movimento = ehHabitoDeMovimento(habit.nome)

            return (
              <li key={habit.id}>
                <button
                  type="button"
                  aria-pressed={isDone}
                  aria-expanded={movimento ? movimentoAberto : undefined}
                  onClick={() => {
                    haptic('light')
                    if (movimento) setMovimentoAberto((v) => !v)
                    else toggle.mutate({ habitId: habit.id, date: today, completed: !isDone })
                  }}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-[var(--r-sm)] text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <Icon name="check_circle" size={24} filled={isDone} className={isDone ? 'text-brasa' : 'text-cinza2'} />
                  <span className={cn('min-w-0 flex-1 truncate text-[14px]', isDone ? 'text-nevoa' : 'text-cinza')}>{habit.nome}</span>
                  {streak > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brasa/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brasa [font-family:var(--font-display)]">
                      <Icon name="local_fire_department" size={14} filled />
                      {streak}
                    </span>
                  )}
                  <span className={cn('w-10 shrink-0 text-right text-[12px]', isDone ? 'text-cinza2-texto' : 'text-transparent')} aria-hidden={!isDone}>
                    Feito
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
            <div className="mb-2 flex flex-col gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
              <p className="flex items-center gap-2 text-[13px] text-nevoa">
                <Icon name="fitness_center" size={18} className="text-brasa" />
                Treino de hoje: {treinoDeHoje ?? 'descanso'}
              </p>
              <button type="button" onClick={() => navigate('/workout')} className="ds-btn-ghost w-full outline-none">
                <Icon name="fitness_center" size={18} />
                Ir para o treino de hoje
              </button>
              <button
                type="button"
                onClick={() => navigate(`/mobilidade?rotina=manha&iniciar=1&habito=${movimento.id}`)}
                className="ds-btn-primary w-full outline-none"
              >
                <Icon name="self_improvement" size={18} />
                Fazer ativação de 5 min primeiro
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('light')
                  toggle.mutate({ habitId: movimento.id, date: today, completed: !feito })
                }}
                className="min-h-11 rounded-full px-3 text-[13px] text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
              >
                {feito ? 'Desmarcar hábito' : 'Já me movi — só marcar feito'}
              </button>
            </div>
          )
        })()}
    </GlassCard>
  )
}
