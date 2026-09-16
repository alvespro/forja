import { useEffect, useRef, useState } from 'react'

/**
 * `true` enquanto o usuário rola para baixo (esconde FABs); volta a `false` ao
 * rolar para cima ou perto do topo. Ignora tremidas menores que `limiar` px.
 */
export function useHideOnScroll(limiar = 8): boolean {
  const [escondido, setEscondido] = useState(false)
  const ultimoY = useRef(0)

  useEffect(() => {
    ultimoY.current = window.scrollY
    let quadro = 0
    const aoRolar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - ultimoY.current
        if (y < 80) setEscondido(false)
        else if (Math.abs(delta) >= limiar) setEscondido(delta > 0)
        if (Math.abs(delta) >= limiar || y < 80) ultimoY.current = y
      })
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('scroll', aoRolar)
    }
  }, [limiar])

  return escondido
}
