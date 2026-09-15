import type { ReactNode } from 'react'

import { DecimalValue } from '@/components/ds/metric-hero'
import { StatusDot, type StatusDotColor } from '@/components/ds/status-dot'
import { cn } from '@/lib/utils'

type MetricCardSize = 'sm' | 'md' | 'lg'

const NUMERO: Record<MetricCardSize, string> = {
  sm: 'text-[26px]',
  md: 'text-[40px]',
  lg: 'text-[56px]',
}

const UNIDADE: Record<MetricCardSize, string> = {
  sm: 'text-[13px]',
  md: 'text-[18px]',
  lg: 'text-[24px]',
}

export type MetricCardProps = {
  label: string
  /** Número de ordem do DeerFlow ("01"). */
  numOrdem?: string | number
  /** `null`/`undefined` = sem dado: mostra "—" sobre o padrão de pontos. */
  numero?: string | number | null
  unidade?: string
  statusLabel?: string
  statusColor?: StatusDotColor
  statusPulse?: boolean
  size?: MetricCardSize
  /** Cor do número. */
  tone?: 'nevoa' | 'brasa' | 'ok' | 'alerta'
  /** Conteúdo extra à direita do número (Sparkline) ou abaixo (EcgLine). */
  aside?: ReactNode
  footer?: ReactNode
  className?: string
}

const TOM = { nevoa: 'text-nevoa', brasa: 'text-brasa', ok: 'text-ok', alerta: 'text-alerta-texto' } as const

/**
 * Card de métrica padrão DeerFlow: label numerado no topo, número dominante em
 * Space Mono, status com ponto. Sem dado, o fundo ganha o padrão de pontos.
 */
export function MetricCard({
  label,
  numOrdem,
  numero,
  unidade,
  statusLabel,
  statusColor = 'cinza',
  statusPulse = false,
  size = 'md',
  tone = 'nevoa',
  aside,
  footer,
  className,
}: MetricCardProps) {
  const semDado = numero == null || numero === ''
  const ordem = numOrdem != null ? String(numOrdem).padStart(2, '0') : null

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-[var(--r-md)] border border-linha bg-aco p-3',
        semDado && 'ds-dots',
        className,
      )}
    >
      <span className="ds-terminal-xs flex min-w-0 gap-2 text-cinza">
        {ordem && <span className="text-cinza2-texto" aria-hidden="true">{ordem}</span>}
        <span className="truncate">{label}</span>
      </span>

      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
        <div className="flex min-w-0 items-baseline gap-1">
          <span
            className={cn(
              'font-bold leading-none tracking-[-0.03em] tabular-nums [font-family:var(--font-display)]',
              NUMERO[size],
              semDado ? 'text-cinza2-texto' : TOM[tone],
            )}
          >
            {semDado ? '—' : <DecimalValue value={numero} />}
          </span>
          {unidade && !semDado && (
            <span className={cn('leading-none text-cinza [font-family:var(--font-display)]', UNIDADE[size])}>{unidade}</span>
          )}
        </div>
        {aside}
      </div>

      {footer}

      {statusLabel && <StatusDot color={statusColor} pulse={statusPulse} label={statusLabel} colorLabel={statusColor !== 'cinza'} />}
    </div>
  )
}
