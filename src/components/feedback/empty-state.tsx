import { Icon } from '@/components/Icon'
import type { IconName } from '@/lib/icons'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  /** Texto principal. Mantido para compatibilidade com os usos existentes. */
  message: string
  /** Por que isso importa — linha de apoio opcional. */
  description?: string
  icon?: IconName
  /** CTA primário (ex.: <Button>Registrar</Button>). */
  action?: ReactNode
}

/** Estado vazio: ícone SVG em cinza sobre o padrão de pontos, título, apoio e CTA. */
export function EmptyState({ message, description, icon = 'inbox', action }: EmptyStateProps) {
  return (
    <div className="glass-card ds-dots flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <Icon name={icon} size={22} className="text-cinza" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-[18px] font-semibold leading-snug text-nevoa">{message}</p>
        {description && <p className="text-[14px] leading-normal text-cinza">{description}</p>}
      </div>
      {action}
    </div>
  )
}
