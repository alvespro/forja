import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type RingSize = 'sm' | 'md' | 'lg'

const DIMENSIONS: Record<RingSize, { box: number; stroke: number; font: string }> = {
  sm: { box: 48, stroke: 5, font: 'ds-data-md' },
  md: { box: 80, stroke: 7, font: 'ds-data-lg' },
  lg: { box: 120, stroke: 9, font: 'ds-display-sm text-[28px]' },
}

export type ProgressRingProps = {
  /** 0 a 100. Valores acima de 100 são exibidos, mas o anel satura. */
  value: number
  size?: RingSize
  /** Cor do traço preenchido. Padrão: brasa. */
  color?: string
  /** Conteúdo do centro. Padrão: o percentual. */
  children?: React.ReactNode
  label?: string
  className?: string
}

/**
 * Anel de progresso animado (referência: Apple Activity Rings).
 * Anima via stroke-dashoffset — respeita prefers-reduced-motion pela regra global.
 */
export function ProgressRing({
  value,
  size = 'md',
  color = 'var(--brasa)',
  children,
  label,
  className,
}: ProgressRingProps) {
  const { box, stroke, font } = DIMENSIONS[size]
  const radius = (box - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))

  // Anima do zero na montagem, para o anel "crescer" quando os dados chegam.
  const [animado, setAnimado] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimado(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90" role="img" aria-label={label ?? `${Math.round(value)}%`}>
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke="var(--linha)"
            strokeWidth={stroke}
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (animado / 100) * circumference}
            style={{ transition: 'stroke-dashoffset var(--dur-slow) var(--spring-smooth)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children ?? <span className={cn(font, 'text-foreground')}>{Math.round(value)}%</span>}
        </div>
      </div>
      {label && <span className="ds-body-sm text-aco-texto">{label}</span>}
    </div>
  )
}
