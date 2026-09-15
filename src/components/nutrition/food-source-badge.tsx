import { useState } from 'react'

import { FONTES, type FonteAlimento } from '@/lib/food-sources'
import { cn } from '@/lib/utils'

const ESTILO: Record<FonteAlimento, string> = {
  taco: 'bg-[#1e7d4f]/25 text-[#7fd4a8]',
  off: 'bg-[#3b82f6]/20 text-[#93c5fd]',
  usda: 'bg-[#1e3a8a]/50 text-[#a5b4fc]',
  ia_estimado: 'bg-atencao/15 text-atencao',
}

/**
 * Selo da base de onde veio o alimento. Tocar abre a explicação da fonte
 * (confiabilidade, origem dos dados) logo abaixo.
 */
export function FoodSourceBadge({ fonte, className }: { fonte: FonteAlimento; className?: string }) {
  const [aberto, setAberto] = useState(false)
  const info = FONTES[fonte]

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAberto((v) => !v)
        }}
        aria-expanded={aberto}
        aria-label={`${info.badge}: ${info.resumo}. Toque para saber mais.`}
        className="group relative flex w-fit max-w-full flex-col items-start gap-0.5 text-left outline-none after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', ESTILO[fonte])}>
          {info.badge}
        </span>
        <span className="text-[11px] leading-tight text-aco-texto underline-offset-2 group-hover:underline">
          {info.resumo}
        </span>
      </button>
      {aberto && (
        <p role="note" className="rounded-[var(--radius-sm)] border border-linha bg-meia-noite/60 p-2 text-xs leading-snug text-aco-texto">
          {info.explicacao}
        </p>
      )}
    </div>
  )
}
