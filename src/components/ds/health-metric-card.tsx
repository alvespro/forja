import type { LucideIcon } from 'lucide-react'

import { MetricHero } from '@/components/ds/metric-hero'
import { cn } from '@/lib/utils'

export type HealthStatus = 'ok' | 'atencao' | 'alerta' | 'neutro'

const STATUS_STYLE: Record<HealthStatus, { bg: string; fg: string; label: string }> = {
  ok: { bg: 'bg-ok/15', fg: 'text-ok', label: 'No alvo' },
  atencao: { bg: 'bg-atencao/15', fg: 'text-atencao', label: 'Atenção' },
  alerta: { bg: 'bg-alerta/15', fg: 'text-alerta', label: 'Fora' },
  neutro: { bg: 'bg-aco-claro', fg: 'text-aco-texto', label: 'Sem meta' },
}

export type HealthMetricCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  status?: HealthStatus
  /** Últimos valores (mais antigo → mais recente) para a sparkline. */
  tendencia?: number[]
  /** Progresso até a meta, 0–100. */
  progressoMeta?: number | null
  /** Linha de apoio sob a barra (ex.: "meta 14% · ~12 sem"). */
  rodape?: string | null
  className?: string
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  if (values.length < 2) return null
  const w = 48
  const h = 20
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Card de métrica de saúde: ícone por status, número herói, sparkline e pill. */
export function HealthMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status = 'neutro',
  tendencia,
  progressoMeta,
  rodape,
  className,
}: HealthMetricCardProps) {
  const s = STATUS_STYLE[status]
  const strokeVar = status === 'neutro' ? 'var(--aco-texto)' : `var(--${status})`

  return (
    <div className={cn('flex min-w-0 flex-col gap-3 overflow-hidden rounded-[var(--radius-lg)] bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex size-10 items-center justify-center rounded-[var(--radius-sm)]', s.bg)}>
          <Icon className={cn('size-5', s.fg)} aria-hidden="true" />
        </span>
        <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 ds-data-sm', s.bg, s.fg)}>{s.label}</span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <MetricHero label={label} value={value} unit={unit} size="xs" tone="foreground" className="min-w-0" />
        {tendencia && <Sparkline values={tendencia} stroke={strokeVar} />}
      </div>

      {progressoMeta != null && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-aco-claro">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progressoMeta))}%`,
              backgroundColor: strokeVar,
              transition: 'width var(--dur-slow) var(--spring-smooth)',
            }}
          />
        </div>
      )}
      {rodape && <span className="ds-data-sm truncate text-aco-texto">{rodape}</span>}
    </div>
  )
}
