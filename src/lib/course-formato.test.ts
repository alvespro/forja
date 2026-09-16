import { describe, expect, it } from 'vitest'

import { COURSE_FORMATOS, formatoInfo, normalizarUrl, pedeUrl, progressoModulos } from './course-formato'

describe('formatos de curso', () => {
  it('tem as 5 opções na ordem da escolha', () => {
    expect(COURSE_FORMATOS.map((f) => f.value)).toEqual(['leitura', 'video_aula', 'modulos', 'link', 'analise_area'])
  })

  it('formatoInfo devolve null para curso antigo sem formato', () => {
    expect(formatoInfo(null)).toBeNull()
    expect(formatoInfo('modulos')?.label).toBe('Capítulos/Módulos')
  })

  it('link e video-aula pedem URL; os outros não', () => {
    expect(pedeUrl('link')).toBe(true)
    expect(pedeUrl('video_aula')).toBe(true)
    expect(pedeUrl('leitura')).toBe(false)
    expect(pedeUrl(null)).toBe(false)
  })
})

describe('progressoModulos', () => {
  it('percentual arredondado de feitos / total', () => {
    expect(progressoModulos(3, 10)).toBe(30)
    expect(progressoModulos(1, 3)).toBe(33)
  })

  it('sem total conhecido não calcula', () => {
    expect(progressoModulos(2, null)).toBeNull()
    expect(progressoModulos(2, 0)).toBeNull()
  })

  it('limita entre 0 e 100', () => {
    expect(progressoModulos(12, 10)).toBe(100)
    expect(progressoModulos(null, 10)).toBe(0)
  })
})

describe('normalizarUrl', () => {
  it('completa https:// quando falta o protocolo', () => {
    expect(normalizarUrl('youtube.com/watch?v=1')).toBe('https://youtube.com/watch?v=1')
    expect(normalizarUrl('http://site.com')).toBe('http://site.com')
  })

  it('vazio vira null', () => {
    expect(normalizarUrl('   ')).toBeNull()
  })
})
