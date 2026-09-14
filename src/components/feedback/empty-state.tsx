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

export function EmptyState({ message, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-aco-claro">
        <Icon className="size-5 text-aco-texto" aria-hidden="true" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="ds-body-md font-semibold text-foreground">{message}</p>
        {description && <p className="ds-body-sm text-aco-texto">{description}</p>}
      </div>
      {action}
    </div>
  )
}
