import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { RecoveryGateCard } from '@/components/today/recovery-gate-card'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useRecoveryGate } from '@/hooks/use-recovery-gate'
import { useActiveDietPlan, useMealSlots } from '@/hooks/use-diet-plan'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import {
  currentIsoWeekDates,
  nowMinutesInSaoPaulo,
  parseDateOnly,
  todayInSaoPaulo,
  toSaoPauloDateString,
} from '@/lib/date'
import { classifyMeals, horarioToMinutes } from '@/lib/meal-schedule'
import { computeNextAction } from '@/lib/next-action'
import { pickTodaysWorkout } from '@/lib/workout-rotation'

/** SECTION 2 (col. 2) do cockpit: a única ação mais relevante para agora, em vidro com borda brasa. */
export function NextActionCard() {
  const dietPlan = useActiveDietPlan()
  const mealSlots = useMealSlots(dietPlan.data?.id)
  const metrics = useBodyMetrics()
  const sessions = useWorkoutSessions()
  const workouts = useWorkouts()
  const recuperacao = useRecoveryGate()

  const action = useMemo(() => {
    const nowMinutes = nowMinutesInSaoPaulo()
    const today = todayInSaoPaulo()
    const isSunday = parseDateOnly(today).getDay() === 0

    const weekDates = new Set(currentIsoWeekDates())
    const weighedThisWeek = (metrics.data ?? []).some((m) => weekDates.has(m.medido_em))

    // Data do treino no fuso de São Paulo (um treino às 22h não pode cair no dia seguinte).
    const treinouHoje = (sessions.data ?? []).some(
      (s) => s.performed_at && toSaoPauloDateString(s.performed_at) === today,
    )

    const slots = mealSlots.data ?? []
    const timing = classifyMeals(slots, nowMinutes)
    const currentSlot = slots.find((s) => s.id === timing.currentId) ?? null
    const currentMeal = currentSlot
      ? { nome: currentSlot.nome, minutes: horarioToMinutes(currentSlot.horario_alvo) }
      : null

    const ativos = (workouts.data ?? []).filter((w) => w.ativo)
    const proximoTreino = pickTodaysWorkout(ativos, sessions.data?.[0]?.workout_id ?? null)?.nome ?? null

    return computeNextAction({ nowMinutes, isSunday, weighedThisWeek, treinouHoje, currentMeal, proximoTreino })
  }, [metrics.data, mealSlots.data, sessions.data, workouts.data])

  // Recuperação baixa vem antes de qualquer outra ação do dia.
  if (recuperacao.gate) return <RecoveryGateCard gate={recuperacao.gate} score={recuperacao.score} />

  return (
    <GlassCard active className="flex h-full flex-col gap-3" padding="var(--s4)" aria-label="Próxima ação">
      <div className="flex items-center gap-2 text-cinza2-texto">
        <Icon name={action.icon} size={28} className="text-brasa" />
        <span className="text-[12px] font-medium">Próxima ação</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-[16px] font-bold leading-snug text-nevoa">{action.title}</h2>
        <p className="line-clamp-3 text-[12px] leading-snug text-cinza">{action.subtitle}</p>
      </div>
      {action.ctaLabel && action.to && (
        <Link to={action.to} className="ds-btn-primary w-full gap-1 px-2 text-[13px]">
          {action.ctaLabel}
          <Icon name="arrow_forward" size={16} />
        </Link>
      )}
    </GlassCard>
  )
}
