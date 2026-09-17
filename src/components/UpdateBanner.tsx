import { useState } from 'react'

import { Icon } from '@/components/Icon'
import { usePWAUpdate } from '@/hooks/usePWAUpdate'
import { cn } from '@/lib/utils'

/**
 * Banner no topo quando há versão nova do app. "Atualizar agora" ativa o service worker
 * novo e recarrega; "Depois" fecha — a versão nova entra na próxima vez que o app abrir.
 * `previa` (só na galeria /design) mostra o banner no fluxo da página, sem versão nova.
 */
export function UpdateBanner({ previa = false }: { previa?: boolean }) {
  const { needRefresh, updateServiceWorker } = usePWAUpdate()
  const [dispensado, setDispensado] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  if ((!needRefresh && !previa) || dispensado) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'forja-update-banner border-b border-brasa bg-[#1D1D1D] px-4 pb-3 shadow-[var(--glass-shadow)]',
        previa ? 'relative' : 'fixed inset-x-0 top-0 z-50',
      )}
      style={{ paddingTop: previa ? 12 : 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-nevoa">
          <Icon name="system_update" size={22} className="text-brasa" />
          Nova versão disponível
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDispensado(true)} disabled={atualizando} className="ds-btn-ghost min-h-11 px-4">
            Depois
          </button>
          <button
            type="button"
            disabled={atualizando}
            onClick={() => {
              setAtualizando(true)
              void updateServiceWorker(true)
            }}
            className="ds-btn-primary min-h-11 px-4"
          >
            {atualizando ? <Icon name="progress_activity" size={18} className="animate-spin" /> : <Icon name="refresh" size={18} />}
            {atualizando ? 'Atualizando…' : 'Atualizar agora'}
          </button>
        </div>
      </div>
    </div>
  )
}
