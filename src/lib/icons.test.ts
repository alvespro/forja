import { describe, expect, it } from 'vitest'

import html from '../../index.html?raw'

import { ICONS, iconNamesParam } from './icons'

describe('Material Symbols', () => {
  it('index.html tem o placeholder que o plugin do Vite troca pelos ícones do mapa', () => {
    expect(html).toContain('icon_names=__ICON_NAMES__')
  })

  it('icon_names: nomes únicos, em ordem alfabética, só [a-z0-9_]', () => {
    const lista = iconNamesParam().split(',')
    expect(lista).toEqual([...new Set(Object.values(ICONS))].sort())
    for (const nome of lista) expect(nome).toMatch(/^[a-z0-9_]+$/)
  })
})
