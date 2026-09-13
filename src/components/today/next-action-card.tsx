import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useActiveDietPlan, useMealSlots } from '@/hooks/use-diet-plan'
import { currentIsoWeekDates, nowMinutesInSaoPaulo, parseDateOnly, todayInSaoPaulo } from '@/lib/date'
import { classifyMeals, horarioToMinutes } from '@/lib/meal-schedule'
import { computeNextAction } from '@/lib/next-action'

/** BLOCO 2 do cockpit: a única ação mais relevante para agora. */
export function NextActionCard() {
  const dietPlan = useActiveDietPlan()
  const mealSlots = useMealSlots(dietPlan.data?.id)
  const metrics = useBodyMetrics()

  const action = useMemo(() => {
    const nowMinutes = nowMinutesInSaoPaulo()
    const today = todayInSaoPaulo()
    const isSunday = parseDateOnly(today).getDay() === 0

    const weekDates = new Set(currentIsoWeekDates())
    const weighedThisWeek = (metrics.data ?? []).some((m) => weekDates.has(m.medido_em))

    const slots = mealSlots.data ?? []
    const timing = classifyMeals(slots, nowMinutes)
    const currentSlot = slots.find((s) => s.id === timing.currentId) ?? null
    const currentMeal = currentSlot
      ? { nome: currentSlot.nome, minutes: horarioToMinutes(currentSlot.horario_alvo) }
      : null

    return computeNextAction({ nowMinutes, isSunday, weighedThisWeek, currentMeal })
  }, [metrics.data, mealSlots.data])

  return (
    <Card className="border-brasa">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {action.icon}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wide text-brasa">Agora</span>
            <span className="font-medium text-foreground">{action.title}</span>
          </div>
        </div>
        {action.ctaLabel && action.to && (
          <Button asChild size="sm" className="shrink-0">
            <Link to={action.to}>{action.ctaLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
