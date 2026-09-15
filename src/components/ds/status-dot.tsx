import { cn } from '@/lib/utils'

export type StatusDotColor = 'brasa' | 'ok' | 'alerta' | 'cinza'

const COR: Record<StatusDotColor, { bg: string; halo: string; texto: string }> = {
  brasa: { bg: 'var(--brasa)', halo: 'rgba(252, 76, 19, 0.5)', texto: 'text-brasa' },
  ok: { bg: 'var(--ok)', halo: 'rgba(76, 175, 125, 0.5)', texto: 'text-ok' },
  alerta: { bg: 'var(--alerta)', halo: 'rgba(193, 8, 1, 0.55)', texto: 'text-alerta-texto' },
  cinza: { bg: 'var(--cinza2)', halo: 'rgba(100, 100, 100, 0.5)', texto: 'text-cinza' },
}

type StatusDotProps = {
  color?: StatusDotColor
  pulse?: boolean
  /** Texto ao lado do ponto, em dot-matrix (ex.: "ATIVO", "SYNC OK"). */
  label?: string
  /** Pinta o label com a cor do status (padrão: cinza). */
  colorLabel?: boolean
  className?: string
}

/** Ponto de status 8×8 estilo DeerFlow, opcionalmente pulsante e com label VT323. */
export function StatusDot({ color = 'brasa', pulse = false, label, colorLabel = false, className }: StatusDotProps) {
  const c = COR[color]
  const ponto = (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2 shrink-0 rounded-full', pulse && 'animate-pulse-brasa')}
      style={{ backgroundColor: c.bg, ['--dot-halo' as string]: c.halo }}
    />
  )
  if (!label) return <span className={cn('inline-flex', className)}>{ponto}</span>
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {ponto}
      <span className={cn('ds-terminal-sm', colorLabel ? c.texto : 'text-cinza')}>{label}</span>
    </span>
  )
}
