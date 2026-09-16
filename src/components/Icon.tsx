import type { CSSProperties } from 'react'

import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface IconProps {
  /** Nome do Material Symbol (ex.: "fitness_center") — precisa estar em lib/icons.ts. */
  name: IconName
  /** px, default 24 */
  size?: number
  /** FILL 1 (estado ativo/marcado) */
  filled?: boolean
  /** Default: currentColor */
  color?: string
  className?: string
  onClick?: () => void
  /** Texto para leitor de tela; sem ele o ícone é decorativo (aria-hidden). */
  label?: string
  style?: CSSProperties
}

/**
 * Material Symbols Outlined como fonte variável. O preenchimento anima via
 * font-variation-settings (classe icon-animated) ao alternar `filled`.
 */
export function Icon({ name, size = 24, filled = false, color, className, onClick, label, style }: IconProps) {
  const opsz = Math.min(48, Math.max(20, size))
  return (
    <span
      className={cn('material-symbols-outlined icon-animated', filled && 'icon-filled', className)}
      style={{
        fontSize: size,
        width: size,
        height: size,
        // Sem `color`, herda do texto (currentColor) — e classes como text-brasa continuam valendo.
        ...(color ? { color } : null),
        fontVariationSettings: filled
          ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${opsz}`
          : `'FILL' 0, 'wght' 300, 'GRAD' -25, 'opsz' ${opsz}`,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {name}
    </span>
  )
}
