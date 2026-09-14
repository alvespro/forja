import { useState } from 'react'
import { X, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type AlertTone = 'critico' | 'atencao' | 'info'

const TONE: Record<AlertTone, { bar: string; icon: string; bg: string }> = {
  critico: { bar: 'bg-alerta', icon: 'text-alerta', bg: 'bg-alerta/10' },
  atencao: { bar: 'bg-atencao', icon: 'text-atencao', bg: 'bg-atencao/10' },
  info: { bar: 'bg-aco-texto', icon: 'text-aco-texto', bg: 'bg-aco-claro/60' },
}

export type AlertItemProps = {
  tone?: AlertTone
  icon: LucideIcon
  title: string
  /** Texto de apoio. Longo? Fica recolhido em 3 linhas com "Ler tudo". */
  body?: string | null
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
}

const CLAMP_THRESHOLD = 140

/** Alerta compacto do cockpit: ícone + título curto + ação. Vermelho crítico, âmbar atenção. */
export function AlertItem({ tone = 'atencao', icon: Icon, title, body, action, onDismiss }: AlertItemProps) {
  const [aberto, setAberto] = useState(false)
  const t = TONE[tone]
  const longo = (body?.length ?? 0) > CLAMP_THRESHOLD

  return (
    <div role={tone === 'critico' ? 'alert' : undefined} className={cn('relative flex gap-3 overflow-hidden rounded-[var(--radius-md)] p-4 pl-5', t.bg)}>
      <span className={cn('absolute inset-y-0 left-0 w-1', t.bar)} aria-hidden="true" />
      <Icon className={cn('mt-0.5 size-5 shrink-0', t.icon)} aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="ds-body-md font-semibold text-foreground">{title}</p>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dispensar alerta"
              className="-m-2 flex size-10 shrink-0 items-center justify-center rounded-full text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {body && (
          <p className={cn('ds-body-sm whitespace-pre-line text-aco-texto', longo && !aberto && 'line-clamp-3')}>{body}</p>
        )}

        {(longo || action) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {longo && (
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="flex min-h-9 items-center ds-body-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {aberto ? 'Recolher' : 'Ler tudo'}
              </button>
            )}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className={cn('flex min-h-9 items-center ds-body-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring', t.icon)}
              >
                {action.label} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
