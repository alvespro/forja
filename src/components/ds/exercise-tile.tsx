import { useState, type PointerEvent } from 'react'

import { gradientForGroup, iconForGroup } from '@/lib/muscle-groups'
import { cn } from '@/lib/utils'

export type ExerciseTileProps = {
  nome: string
  grupo: string | null
  youtubeId?: string | null
  /** Última carga usada, em kg. */
  ultimaCarga?: number | null
  /** Recorde de carga — ativa o badge PR quando a última carga o iguala. */
  recorde?: number | null
  onSelect?: () => void
  className?: string
}

type Ripple = { id: number; x: number; y: number }

/**
 * Card de exercício (referência: FitFolio). Thumbnail ou fallback com a cor
 * do grupo, carga em destaque e ripple no toque (Material You).
 */
export function ExerciseTile({
  nome,
  grupo,
  youtubeId,
  ultimaCarga,
  recorde,
  onSelect,
  className,
}: ExerciseTileProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const isPR = ultimaCarga != null && recorde != null && ultimaCarga >= recorde

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ripple = { id: Date.now(), x: event.clientX - rect.left, y: event.clientY - rect.top }
    setRipples((r) => [...r, ripple])
    window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 500)
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerDown={handlePointerDown}
      className={cn(
        'ds-pressable-card relative flex w-full items-center gap-3 overflow-hidden rounded-[var(--radius-md)] border border-border bg-card p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute size-2 rounded-full bg-brasa/30"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ds-ripple 500ms var(--spring-smooth) forwards',
          }}
        />
      ))}

      {youtubeId ? (
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          className="h-16 w-24 shrink-0 rounded-[var(--radius-sm)] object-cover"
        />
      ) : (
        <div
          className="flex h-16 w-24 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-2xl"
          style={{ background: gradientForGroup(grupo) }}
          aria-hidden="true"
        >
          {iconForGroup(grupo)}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="ds-body-md truncate font-semibold text-foreground">{nome}</span>
        {grupo && <span className="ds-body-sm text-aco-texto">{grupo}</span>}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {ultimaCarga != null ? (
          <span className="ds-display-sm text-[22px] text-foreground">
            {ultimaCarga}
            <span className="ds-data-md text-aco-texto">kg</span>
          </span>
        ) : (
          <span className="ds-data-md text-aco-texto">—</span>
        )}
        {isPR && (
          <span className="rounded-full bg-brasa px-2 py-0.5 ds-data-sm font-bold text-meia-noite">PR</span>
        )}
      </div>
    </button>
  )
}
