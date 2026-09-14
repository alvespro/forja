import { MetricHero } from '@/components/ds/metric-hero'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useDailyScores } from '@/hooks/use-daily-scores'
import { todayInSaoPaulo } from '@/lib/date'
import { computeStreak } from '@/lib/gamification'

/**
 * SECTION 4 do cockpit: três métricas do momento, sem borda.
 * O streak é o mesmo do placar e das conquistas (computeStreak sobre os scores
 * diários) — antes este card contava pelo calendário de atividades, e a tela
 * mostraria dois "streaks" diferentes.
 */
export function QuickStatsCard() {
  const metrics = useBodyMetrics()
  const scores = useDailyScores()

  const latest = metrics.data && metrics.data.length > 0 ? metrics.data[metrics.data.length - 1] : null
  const streak = computeStreak(scores.data ?? [], todayInSaoPaulo())

  const stats = [
    { label: 'Peso', value: latest?.peso_kg != null ? String(latest.peso_kg).replace('.', ',') : '—', unit: latest?.peso_kg != null ? 'kg' : undefined },
    { label: 'Gordura', value: latest?.gordura_pct != null ? String(latest.gordura_pct).replace('.', ',') : '—', unit: latest?.gordura_pct != null ? '%' : undefined },
    { label: 'Streak', value: String(streak), unit: 'd' },
  ]

  return (
    <section className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="flex min-w-0 flex-col rounded-[var(--radius-md)] bg-aco/60 px-3 py-3">
          <MetricHero label={s.label} value={s.value} unit={s.unit} size="xs" tone="foreground" className="min-w-0" />
        </div>
      ))}
    </section>
  )
}
