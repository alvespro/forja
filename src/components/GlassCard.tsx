import type { CSSProperties, ElementType, KeyboardEvent, ReactNode } from 'react'

import { useRipple } from '@/hooks/use-ripple'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  /** Borda brasa quando ativo */
  active?: boolean
  /** Glow laranja sutil */
  glow?: boolean
  /** Gradiente diagonal interno */
  gradient?: boolean
  /** Default: var(--s5) */
  padding?: string
  /** Blur de fundo — só quando há conteúdo passando por trás (flutuante/fixo). */
  blur?: boolean
  as?: ElementType
  style?: CSSProperties
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * Card base do Liquid Glass: vidro translúcido, borda clara, linha de brilho no
 * topo. Com `onClick` vira botão acessível (teclado + ripple no toque).
 */
export function GlassCard({
  children,
  className,
  onClick,
  active = false,
  glow = false,
  gradient = false,
  padding = 'var(--s5)',
  blur = false,
  as,
  style,
  ...aria
}: GlassCardProps) {
  const ripple = useRipple()
  const Comp = as ?? (onClick ? 'div' : 'section')
  const interativo = Boolean(onClick)

  return (
    <Comp
      className={cn('glass-card', interativo && 'interactive cursor-pointer', active && 'active', glow && 'glow', gradient && 'gradient', blur && 'glass-blur', className)}
      style={{ padding, ...style }}
      onClick={onClick}
      onPointerDown={interativo ? ripple : undefined}
      role={interativo ? 'button' : undefined}
      tabIndex={interativo ? 0 : undefined}
      onKeyDown={
        interativo
          ? (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      {...aria}
    >
      {children}
    </Comp>
  )
}
