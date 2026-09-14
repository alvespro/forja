import { describe, expect, it } from 'vitest'

import { colorForGroup, groupSortIndex, iconForGroup, primaryGroupKey, resolveGroupKeys, SEM_GRUPO } from './muscle-groups'

describe('resolveGroupKeys', () => {
  it('reconhece nomes compostos na ordem em que aparecem', () => {
    expect(resolveGroupKeys('Costas e Bíceps')).toEqual(['costas', 'biceps'])
    expect(resolveGroupKeys('Bíceps e Tríceps')).toEqual(['biceps', 'triceps'])
  })

  it('reconhece sinônimos', () => {
    expect(resolveGroupKeys('Membros Inferiores')).toEqual(['pernas'])
    expect(resolveGroupKeys('Abdômen')).toEqual(['core'])
    expect(resolveGroupKeys('Deltoide lateral')).toEqual(['ombros'])
  })

  it('ignora acentos e caixa', () => {
    expect(resolveGroupKeys('TRÍCEPS')).toEqual(['triceps'])
    expect(resolveGroupKeys('glúteos')).toEqual(['gluteo'])
  })

  it('não confunde palavra contida em outra', () => {
    // "perna" não pode casar dentro de "pernambuco"; "ombro" não casa em "ombrosamente"
    expect(resolveGroupKeys('pernambuco')).toEqual([])
  })

  it('texto vazio ou sem grupo retorna vazio', () => {
    expect(resolveGroupKeys(null)).toEqual([])
    expect(resolveGroupKeys('Cardio')).toEqual([])
  })
})

describe('derivados do grupo principal', () => {
  it('cor e ícone usam o primeiro grupo mencionado', () => {
    expect(primaryGroupKey('Costas e Bíceps')).toBe('costas')
    expect(colorForGroup('Costas e Bíceps')).toBe(colorForGroup('Costas'))
    expect(iconForGroup('Membros Inferiores')).toBe(iconForGroup('Pernas'))
  })

  it('grupo desconhecido cai no padrão', () => {
    expect(colorForGroup('Cardio')).toBe('#1b2a42')
    expect(iconForGroup(null)).toBe('🏋️')
  })

  it('ordenação: canônicos primeiro, "Outros" por último', () => {
    expect(groupSortIndex('Peito')).toBeLessThan(groupSortIndex('Costas'))
    expect(groupSortIndex('Cardio')).toBeLessThan(groupSortIndex(SEM_GRUPO))
  })
})
