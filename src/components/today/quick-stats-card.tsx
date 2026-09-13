import { useMemo } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useActivityCalendar } from '@/hooks/use-activity-calendar'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { activityLevel } from '@/lib/activity-day'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'

/** Streak = dias consecutivos com atividade terminando hoje (ou ontem, se hoje ainda vazio). */
function currentStreak(map: Map<string, { treino: boolean; cardio: boolean; habitos_pct: number; refeicoes_pct: number }>): number {
  const today = todayInSaoPaulo()
  let cursor = today
  const level = (d: string) => {
    const day = map.get(d)
    return day ? activityLevel(day) : 0
  }
  if (level(today) === 0) cursor = addDaysToDateString(today, -1) // hoje ainda pendente
  let streak = 0
  while (level(cursor) > 0) {
    streak += 1
    cursor = addDaysToDateString(cursor, -1)
  }
  return streak
}

/** BLOCO 4 do cockpit: três métricas do momento. */
export function QuickStatsCard() {
  const metrics = useBodyMetrics()
  const calendar = useActivityCalendar(90)

  const latest = metrics.data && metrics.data.length > 0 ? metrics.data[metrics.data.length - 1] : null
  const streak = useMemo(() => (calendar.data ? currentStreak(calendar.data) : 0), [calendar.data])

  const stats = [
    { label: 'Peso atual', value: latest?.peso_kg != null ? `${latest.peso_kg}kg` : '—' },
    { label: 'Gordura', value: latest?.gordura_pct != null ? `${latest.gordura_pct}%` : '—' },
    { label: 'Streak', value: streak > 0 ? `🔥 ${streak}d` : '—' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} size="sm">
          <CardContent className="flex flex-col items-center gap-0.5 py-3 text-center">
            <span className="text-[10px] uppercase tracking-wide text-aco-texto">{s.label}</span>
            <span className="font-mono text-lg text-foreground">{s.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
