import { MetricCard } from '@/components/ds/metric-card'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useDailyScores } from '@/hooks/use-daily-scores'
import { todayInSaoPaulo } from '@/lib/date'
import { computeStreak } from '@/lib/gamification'

const br = (n: number) => String(n).replace('.', ',')

/**
 * SECTION 2 do cockpit: três métricas do momento em MetricCards pequenos.
 * O streak é o mesmo do placar e das conquistas (computeStreak sobre os scores
 * diários) — antes este card contava pelo calendário de atividades, e a tela
 * mostraria dois "streaks" diferentes.
 */
export function QuickStatsCard() {
  const metrics = useBodyMetrics()
  const scores = useDailyScores()

  const latest = metrics.data && metrics.data.length > 0 ? metrics.data[metrics.data.length - 1] : null
  const streak = computeStreak(scores.data ?? [], todayInSaoPaulo())

  return (
    <section className="grid grid-cols-3 gap-2" aria-label="Métricas rápidas">
      <MetricCard size="sm" label="Peso" numero={latest?.peso_kg != null ? br(latest.peso_kg) : null} unidade="kg" className="border-transparent" />
      <MetricCard size="sm" label="Gordura" numero={latest?.gordura_pct != null ? br(latest.gordura_pct) : null} unidade="%" className="border-transparent" />
      <MetricCard
        size="sm"
        label="Streak"
        numero={streak}
        unidade={streak > 0 ? '🔥' : 'd'}
        tone={streak > 0 ? 'brasa' : 'nevoa'}
        className="border-transparent"
      />
    </section>
  )
}
