import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

const VISIVEIS = 2

/**
 * SECTION 7 do cockpit: no máximo 2 alertas visíveis, com "Ver todos".
 *
 * Cada card de alerta decide sozinho se aparece (retorna null quando não há
 * nada). Como `null` não gera nó no DOM, os filhos reais do contêiner são
 * exatamente os alertas ativos — então contamos e ocultamos por posição, sem
 * precisar que os cards exponham o próprio estado.
 */
export function AlertsSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [total, setTotal] = useState(0)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const contar = () => setTotal(el.children.length)
    contar()
    // Os cards carregam dados assíncronos e aparecem depois da montagem.
    const observer = new MutationObserver(contar)
    observer.observe(el, { childList: true })
    return () => observer.disconnect()
  }, [])

  const ocultos = Math.max(0, total - VISIVEIS)

  return (
    <section className={cn('flex flex-col gap-3', total === 0 && 'hidden')}>
      <div className="flex items-baseline justify-between">
        <span className="ds-label">Alertas</span>
        <span className="ds-data-md text-aco-texto">{total}</span>
      </div>

      <div
        ref={ref}
        className={cn('flex flex-col gap-3', !expandido && '[&>*:nth-child(n+3)]:hidden')}
      >
        {children}
      </div>

      {ocultos > 0 && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-linha ds-body-sm font-semibold text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expandido ? 'Mostrar menos' : `Ver todos (+${ocultos})`}
          <ChevronDown className={cn('size-4 transition-transform', expandido && 'rotate-180')} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
