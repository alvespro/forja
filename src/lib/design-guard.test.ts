import { describe, expect, it } from 'vitest'

// Código-fonte de todos os componentes, como texto (Vite resolve em tempo de teste).
const fontes = import.meta.glob('../**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function ocorrencias(regex: RegExp) {
  return Object.entries(fontes).flatMap(([arquivo, src]) =>
    src.split('\n').flatMap((linha, i) => (regex.test(linha) ? [`${arquivo}:${i + 1}`] : [])),
  )
}

describe('guardas do design system', () => {
  it('texto não usa cinza translúcido (aco-texto/NN fica abaixo de 4,5:1) — use cinza2-texto', () => {
    expect(ocorrencias(/(^|[\s"'`{(:])text-aco-texto\/\d+/)).toEqual([])
  })

  it('<Icon> é fonte, não SVG: fill-*/stroke-* não pintam nada — use a prop filled e text-*', () => {
    // Mesma linha do <Icon>; não para no primeiro ">" porque className costuma ter "nota >= n".
    expect(ocorrencias(/<Icon\b.*?[\s"'`](fill|stroke)-[a-z]/)).toEqual([])
  })
})
