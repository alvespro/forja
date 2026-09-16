import { useCallback, type PointerEvent } from 'react'

/**
 * Ripple no toque: um círculo vermilion translúcido nasce no ponto tocado,
 * cresce (scale 0 → 2,5) e some em 400ms. O elemento precisa de
 * `position: relative; overflow: hidden` (o .glass-card já tem).
 */
export function useRipple() {
  return useCallback((event: PointerEvent<HTMLElement>) => {
    const alvo = event.currentTarget
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = alvo.getBoundingClientRect()
    const tamanho = Math.max(rect.width, rect.height)
    const onda = document.createElement('span')
    onda.className = 'ds-ripple'
    onda.setAttribute('aria-hidden', 'true')
    onda.style.width = `${tamanho}px`
    onda.style.height = `${tamanho}px`
    onda.style.left = `${event.clientX - rect.left}px`
    onda.style.top = `${event.clientY - rect.top}px`
    alvo.appendChild(onda)
    onda.addEventListener('animationend', () => onda.remove(), { once: true })
    // Garantia se a animação não disparar (aba em segundo plano).
    window.setTimeout(() => onda.remove(), 600)
  }, [])
}
