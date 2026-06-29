import { useEffect, useState } from 'react'

/** Observa um media query via matchMedia, com listener de resize — sem dependências externas. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    function handleChange() {
      setMatches(mediaQueryList.matches)
    }
    handleChange()
    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/** Breakpoint `md` do Tailwind (768px) — mesmo ponto de corte usado nas classes `md:`. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
