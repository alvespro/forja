import { GlassCard } from '@/components/GlassCard'
import { Icon } from '@/components/Icon'
import { DecimalValue } from '@/components/ds/metric-hero'
import { useBodyMetrics } from '@/hooks/use-body-metrics'
import { useDailyScores } from '@/hooks/use-daily-scores'
import { todayInSaoPaulo } from '@/lib/date'
import { computeStreak } from '@/lib/gamification'
import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

const br = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',')

type Stat = { icon: IconName; label: string; valor: string | null; unidade: string; variacao: string | null }

/**
 * SECTION 4 do cockpit (weekly activity do Aaru): três cards de vidro com ícone,
 * número em Space Mono e a variação abaixo. Peso e gordura comparam com a
 * medição anterior; o streak é o mesmo do placar (computeStreak).
 */
export function QuickStatsCard() {
  const metrics = useBodyMetrics()
  const scores = useDailyScores()

  const lista = metrics.data ?? []
  const comPeso = lista.filter((m) => m.peso_kg != null)
  const comGordura = lista.filter((m) => m.gordura_pct != null)
  const streak = computeStreak(scores.data ?? [], todayInSaoPaulo())

  const variacao = (atual?: number | null, anterior?: number | null) => {
    if (atual == null || anterior == null) return null
    const d = atual - anterior
    return `${d > 0 ? '↑' : d < 0 ? '↓' : '='} ${br(Math.abs(d))}`
  }

  const pesoAtual = comPeso.at(-1)?.peso_kg ?? null
  const gorduraAtual = comGordura.at(-1)?.gordura_pct ?? null

  const stats: Stat[] = [
    { icon: 'scale', label: 'Peso', valor: pesoAtual != null ? br(pesoAtual) : null, unidade: 'kg', variacao: variacao(pesoAtual, comPeso.at(-2)?.peso_kg) },
    {
      icon: 'local_fire_department',
      label: 'Gordura',
      valor: gorduraAtual != null ? br(gorduraAtual) : null,
      unidade: '%',
      variacao: variacao(gorduraAtual, comGordura.at(-2)?.gordura_pct),
    },
    { icon: 'emoji_events', label: 'Streak', valor: String(streak), unidade: streak === 1 ? 'dia' : 'dias', variacao: null },
  ]

  return (
    <section className="grid grid-cols-3 gap-2" aria-label="Métricas rápidas">
      {stats.map((s) => (
        <GlassCard key={s.label} className="flex min-w-0 flex-col gap-2" padding="var(--s3)" aria-label={s.label}>
          <Icon name={s.icon} size={20} className="text-cinza" label={s.label} />
          <span className="flex min-w-0 items-baseline gap-1">
            <span className={cn('truncate text-[24px] font-bold leading-none tabular-nums [font-family:var(--font-display)]', s.valor ? 'text-nevoa' : 'text-cinza2-texto')}>
              {s.valor ? <DecimalValue value={s.valor} /> : '—'}
            </span>
            {s.valor && <span className="shrink-0 text-[11px] text-cinza">{s.unidade}</span>}
          </span>
          <span className="truncate text-[12px] tabular-nums text-cinza2-texto [font-family:var(--font-display)]">
            {s.variacao ?? (s.label === 'Streak' ? 'seguidos' : '—')}
          </span>
        </GlassCard>
      ))}
    </section>
  )
}
