import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

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

/** SECTION 2 do cockpit: a única ação mais relevante para agora. */
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
    <section
      className="ds-card-brasa relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-lg)] border border-brasa p-5"
      style={{ background: 'linear-gradient(135deg, rgba(240,169,59,0.16) 0%, var(--aco) 55%)' }}
    >
      <div className="flex items-start gap-4">
        <span className="text-[32px] leading-none" aria-hidden="true">
          {action.icon}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="ds-label text-brasa">Agora</span>
          <h2 className="ds-h3 text-foreground">{action.title}</h2>
          <p className="ds-body-md text-aco-texto">{action.subtitle}</p>
        </div>
      </div>

      {action.ctaLabel && action.to && (
        <Link
          to={action.to}
          className="ds-pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-brasa px-5 ds-body-md font-semibold text-meia-noite outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {action.ctaLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
