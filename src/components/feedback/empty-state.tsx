import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  /** Texto principal. Mantido para compatibilidade com os usos existentes. */
  message: string
  /** Por que isso importa — linha de apoio opcional. */
  description?: string
  icon?: LucideIcon
  /** CTA primário (ex.: <Button>Registrar</Button>). */
  action?: ReactNode
}

/** Estado vazio: ícone SVG em cinza sobre o padrão de pontos, título, apoio e CTA. */
export function EmptyState({ message, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="ds-dots flex flex-col items-center gap-3 rounded-[var(--r-lg)] border border-linha bg-aco/60 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-linha bg-fundo">
        <Icon className="size-5 text-cinza" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-[18px] font-semibold leading-snug text-nevoa">{message}</p>
        {description && <p className="text-[14px] leading-normal text-cinza">{description}</p>}
      </div>
      {action}
    </div>
  )
}
