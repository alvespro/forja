import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

type MetricHeroSize = 'lg' | 'md' | 'sm' | 'xs'

const SIZE_CLASS: Record<MetricHeroSize, string> = {
  lg: 'ds-display-lg',
  md: 'ds-display-md',
  sm: 'ds-display-sm',
  xs: 'ds-display-sm text-[32px]',
}

export type MetricHeroProps = {
  /** Label discreto acima do número (ex.: "Peso atual"). */
  label?: string
  value: string | number
  unit?: string
  /** Variação vs. período anterior. `null` de valor = sem comparação. */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean } | null
  size?: MetricHeroSize
  /** Cor do número. Padrão: brasa. */
  tone?: 'brasa' | 'foreground' | 'ok' | 'alerta'
  className?: string
}

const TONE_CLASS = {
  brasa: 'text-brasa',
  foreground: 'text-foreground',
  ok: 'text-ok',
  alerta: 'text-alerta',
} as const

/**
 * Número de performance como herói tipográfico (referência: Apple Fitness+).
 * Uma métrica dominante, com label discreto acima e variação abaixo.
 */
export function MetricHero({
  label,
  value,
  unit,
  delta,
  size = 'md',
  tone = 'brasa',
  className,
}: MetricHeroProps) {
  const DeltaIcon = delta?.direction === 'up' ? ArrowUp : delta?.direction === 'down' ? ArrowDown : Minus
  // "Bom" é semântico, não direcional: perder peso é bom, perder carga não.
  const deltaTone =
    delta?.good === undefined
      ? 'text-aco-texto'
      : delta.good
        ? 'text-ok'
        : 'text-alerta'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <span className="ds-label">{label}</span>}

      <div className="flex items-baseline gap-1.5">
        <span className={cn(SIZE_CLASS[size], TONE_CLASS[tone])}>
          <DecimalValue value={value} />
        </span>
        {unit && <span className="ds-data-lg text-aco-texto">{unit}</span>}
      </div>

      {delta && (
        <span className={cn('flex items-center gap-1 ds-data-md', deltaTone)}>
          <DeltaIcon className="size-3" aria-hidden="true" />
          {delta.value}
        </span>
      )}
    </div>
  )
}

/**
 * Em fonte monoespaçada a vírgula ocupa uma célula inteira ("84 , 4").
 * Compensa o separador decimal com margem negativa para colar nos dígitos.
 */
function DecimalValue({ value }: { value: string | number }) {
  const text = String(value)
  const match = text.match(/^(-?\d+)([.,])(\d+)(.*)$/)
  if (!match) return <>{text}</>
  const [, inteiro, separador, decimal, resto] = match
  return (
    <>
      {inteiro}
      <span className="-mx-[0.22em]">{separador}</span>
      {decimal}
      {resto}
    </>
  )
}
