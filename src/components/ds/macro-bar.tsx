import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type Macro = { atual: number; meta: number }

export type MacroBarProps = {
  proteina: Macro
  carbo: Macro
  gordura: Macro
  /** Esconde os rótulos abaixo (uso compacto em headers). */
  compact?: boolean
  className?: string
}

const SEGMENTS = [
  { key: 'proteina', label: 'prot', color: 'var(--ok)' },
  { key: 'carbo', label: 'carbo', color: 'var(--brasa)' },
  { key: 'gordura', label: 'gord', color: 'var(--alerta)' },
] as const

/**
 * Barra única dividida em três segmentos (referência: MyFitnessPal).
 * A largura de cada segmento é a fatia daquela meta no total de gramas
 * planejado; o preenchimento interno mostra quanto já foi consumido.
 */
export function MacroBar({ proteina, carbo, gordura, compact = false, className }: MacroBarProps) {
  const macros = { proteina, carbo, gordura }
  const totalMeta = proteina.meta + carbo.meta + gordura.meta || 1

  // Preenche a partir do zero quando os dados chegam.
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full" role="img" aria-label="Macros do dia">
        {SEGMENTS.map((s) => {
          const m = macros[s.key]
          const largura = (m.meta / totalMeta) * 100
          const preenchido = m.meta > 0 ? Math.min(m.atual / m.meta, 1) * 100 : 0
          return (
            <div
              key={s.key}
              className="relative h-full overflow-hidden rounded-full bg-aco-claro"
              style={{ width: `${largura}%` }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: montado ? `${preenchido}%` : '0%',
                  backgroundColor: s.color,
                  transition: 'width var(--dur-slow) var(--spring-smooth)',
                }}
              />
            </div>
          )
        })}
      </div>

      {!compact && (
        <div className="grid grid-cols-3 gap-2">
          {SEGMENTS.map((s) => {
            const m = macros[s.key]
            return (
              <div key={s.key} className="flex flex-col">
                <span className="flex items-center gap-1.5 ds-body-sm text-aco-texto">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="ds-data-md text-foreground">
                  {Math.round(m.atual)}
                  <span className="text-aco-texto">/{Math.round(m.meta)}g</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
