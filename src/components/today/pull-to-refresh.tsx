import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { haptic } from '@/lib/haptics'
import { PULL_THRESHOLD, pullDistance } from '@/lib/pull-to-refresh'
import { cn } from '@/lib/utils'

/**
 * Puxar para atualizar (tela Hoje). Só age com a página no topo e com toque —
 * no desktop não faz nada. Soltar além do limiar recarrega as consultas ativas.
 */
export function PullToRefresh() {
  const queryClient = useQueryClient()
  const [distancia, setDistancia] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const inicioY = useRef<number | null>(null)
  const distanciaRef = useRef(0)
  const atualizandoRef = useRef(false)
  const armado = useRef(false)

  useEffect(() => {
    function onStart(e: TouchEvent) {
      if (window.scrollY > 0 || atualizandoRef.current) return
      inicioY.current = e.touches[0]?.clientY ?? null
    }
    function onMove(e: TouchEvent) {
      if (inicioY.current === null) return
      const d = pullDistance((e.touches[0]?.clientY ?? 0) - inicioY.current)
      distanciaRef.current = d
      setDistancia(d)
      // Háptico leve ao cruzar o limiar: avisa que soltar vai atualizar.
      if (d >= PULL_THRESHOLD && !armado.current) {
        armado.current = true
        haptic('light')
      } else if (d < PULL_THRESHOLD) {
        armado.current = false
      }
    }
    async function onEnd() {
      if (inicioY.current === null) return
      inicioY.current = null
      armado.current = false
      const disparou = distanciaRef.current >= PULL_THRESHOLD
      distanciaRef.current = 0
      setDistancia(0)
      if (!disparou) return
      atualizandoRef.current = true
      setAtualizando(true)
      try {
        await queryClient.refetchQueries({ type: 'active' })
      } finally {
        atualizandoRef.current = false
        setAtualizando(false)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [queryClient])

  const visivel = atualizando || distancia > 0
  const progresso = Math.min(1, distancia / PULL_THRESHOLD)
  const deslocamento = atualizando ? PULL_THRESHOLD * 0.6 : distancia * 0.6

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center md:hidden"
      style={{
        top: 'env(safe-area-inset-top, 0px)',
        transform: `translateY(${deslocamento - 8}px)`,
        opacity: visivel ? 1 : 0,
        transition: inicioY.current === null ? 'transform var(--dur-normal) var(--spring-bounce), opacity var(--dur-fast)' : 'none',
      }}
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-full border bg-aco shadow-[var(--shadow-elevated)]',
          progresso >= 1 || atualizando ? 'border-brasa text-brasa' : 'border-linha text-aco-texto',
        )}
      >
        <RefreshCw
          className={cn('size-5', atualizando && 'animate-spin')}
          style={atualizando ? undefined : { transform: `rotate(${progresso * 270}deg)` }}
          aria-hidden="true"
        />
        <span className="sr-only">{atualizando ? 'Atualizando' : ''}</span>
      </span>
    </div>
  )
}
