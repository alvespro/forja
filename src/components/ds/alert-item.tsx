import { useState } from 'react'
import { Icon } from '@/components/Icon'

import type { IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type AlertTone = 'critico' | 'atencao' | 'info'

const TONE: Record<AlertTone, { borda: string; icon: string; label: string; texto: string }> = {
  critico: { borda: 'border-alerta', icon: 'text-alerta-texto', label: '⚠ Alerta', texto: 'text-alerta-texto' },
  atencao: { borda: 'border-brasa', icon: 'text-brasa', label: 'Atenção', texto: 'text-brasa' },
  info: { borda: 'border-cinza2', icon: 'text-cinza', label: 'Aviso', texto: 'text-cinza' },
}

export type AlertItemProps = {
  tone?: AlertTone
  icon: IconName
  title: string
  /** Texto de apoio. Longo? Fica recolhido em 3 linhas com "Ler tudo". */
  body?: string | null
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
}

const CLAMP_THRESHOLD = 140

/** Alerta do cockpit: fundo aço, borda esquerda de 3px pelo tom, label dot-matrix, título e ação. */
export function AlertItem({ tone = 'atencao', icon, title, body, action, onDismiss }: AlertItemProps) {
  const [aberto, setAberto] = useState(false)
  const t = TONE[tone]
  const longo = (body?.length ?? 0) > CLAMP_THRESHOLD

  return (
    <div
      role={tone === 'critico' ? 'alert' : undefined}
      className={cn('flex gap-3 rounded-r-[var(--r-md)] border-l-[3px] border-y border-r border-y-[var(--glass-border)] border-r-[var(--glass-border)] bg-[var(--glass-bg)] p-4', t.borda)}
    >
      <Icon name={icon} size={20} className={cn('mt-0.5', t.icon)} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn('ds-terminal-xs', t.texto)}>{t.label}</span>
            <p className="ds-body-md font-semibold text-nevoa">{title}</p>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dispensar alerta"
              className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-cinza outline-none hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {body && (
          <p className={cn('ds-body-sm whitespace-pre-line text-cinza', longo && !aberto && 'line-clamp-3')}>{body}</p>
        )}

        {(longo || action) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {longo && (
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="flex min-h-11 items-center ds-body-sm font-semibold text-nevoa outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {aberto ? 'Recolher' : 'Ler tudo'}
              </button>
            )}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  'flex min-h-11 min-w-11 items-center ds-body-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tone === 'info' ? 'text-nevoa' : t.texto,
                )}
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
