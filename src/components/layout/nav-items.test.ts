import { describe, expect, it } from 'vitest'

import { isItemActive, isPrimaryPath, primaryNavItems } from './nav-items'

const saude = primaryNavItems.find((i) => i.to === '/health')!
const hoje = primaryNavItems.find((i) => i.to === '/')!

describe('navegação', () => {
  it('Sono é sub-tela de Saúde: acende Saúde, não o "Mais"', () => {
    expect(isItemActive(saude, '/sono')).toBe(true)
    expect(isPrimaryPath('/sono')).toBe(true)
  })

  it('Hoje só casa a raiz exata', () => {
    expect(isItemActive(hoje, '/')).toBe(true)
    expect(isItemActive(hoje, '/health')).toBe(false)
  })

  it('prefixo parecido não conta (/healthy não é /health)', () => {
    expect(isItemActive(saude, '/healthy')).toBe(false)
    expect(isPrimaryPath('/configuracoes')).toBe(false)
  })
})
