import { describe, expect, it } from 'vitest'

import {
  destaqueObservacao,
  faseDe,
  metaReps,
  minutosMobilidade,
  moverNaFase,
  ordenarPorFase,
  parseRepsRange,
  repsAlvoMax,
  resumoPrescricao,
} from './workout-phases'

type P = { id: string; ordem: number; fase: string | null; tempo_seg?: number | null }

describe('ordenarPorFase', () => {
  it('aquecimento → mobilidade → treino → cardio → cooldown, mantendo a ordem dentro da fase', () => {
    const lista: P[] = [
      { id: 'cardio', ordem: 1, fase: 'cardio' },
      { id: 't2', ordem: 6, fase: 'treino' },
      { id: 'mob', ordem: 9, fase: 'mobilidade' },
      { id: 't1', ordem: 5, fase: 'treino' },
      { id: 'cool', ordem: 0, fase: 'cooldown' },
      { id: 'aq', ordem: 2, fase: 'aquecimento' },
    ]
    expect(ordenarPorFase(lista).map((p) => p.id)).toEqual(['aq', 'mob', 't1', 't2', 'cardio', 'cool'])
  })

  it('fase nula ou desconhecida conta como treino', () => {
    expect(faseDe(null)).toBe('treino')
    expect(faseDe('xyz')).toBe('treino')
  })
})

describe('metaReps', () => {
  it('faixa, valor único e fallback para reps_alvo antigo', () => {
    expect(metaReps({ reps_min: 8, reps_max: 12, reps_alvo: null })).toBe('8-12 reps')
    expect(metaReps({ reps_min: 80, reps_max: 80, reps_alvo: null })).toBe('80 reps')
    expect(metaReps({ reps_min: null, reps_max: 15, reps_alvo: null })).toBe('15 reps')
    expect(metaReps({ reps_min: null, reps_max: null, reps_alvo: '6-10' })).toBe('6-10 reps')
    expect(metaReps({ reps_min: null, reps_max: null, reps_alvo: null })).toBeNull()
  })

  it('repsAlvoMax usa reps_max e cai para o maior número de reps_alvo', () => {
    expect(repsAlvoMax({ reps_min: 8, reps_max: 12, reps_alvo: null })).toBe(12)
    expect(repsAlvoMax({ reps_min: null, reps_max: null, reps_alvo: '6-10' })).toBe(10)
    expect(repsAlvoMax({ reps_min: null, reps_max: null, reps_alvo: null })).toBeNull()
  })

  it('parseRepsRange lê texto livre da importação', () => {
    expect(parseRepsRange('8-12')).toEqual({ min: 8, max: 12 })
    expect(parseRepsRange('15')).toEqual({ min: 15, max: 15 })
    expect(parseRepsRange('até a falha')).toEqual({ min: null, max: null })
  })
})

describe('minutosMobilidade', () => {
  it('soma tempo_seg da fase mobilidade e arredonda para cima em minutos', () => {
    const lista: P[] = [
      { id: '1', ordem: 1, fase: 'mobilidade', tempo_seg: 60 },
      { id: '2', ordem: 2, fase: 'mobilidade', tempo_seg: 60 },
      { id: '3', ordem: 3, fase: 'mobilidade', tempo_seg: 30 },
      { id: '4', ordem: 4, fase: 'mobilidade', tempo_seg: 50 },
      { id: '5', ordem: 5, fase: 'treino', tempo_seg: 600 },
    ]
    expect(minutosMobilidade(lista)).toBe(4)
  })

  it('sem mobilidade devolve null (sem badge)', () => {
    expect(minutosMobilidade([{ fase: 'treino' }])).toBeNull()
  })
})

describe('destaqueObservacao', () => {
  it('separa o rótulo em caixa alta do resto do texto', () => {
    expect(destaqueObservacao('TRIO ATIVADOR — 80 reps. Alterne entre os 3')).toEqual({
      rotulo: 'TRIO ATIVADOR',
      detalhe: '80 reps. Alterne entre os 3',
    })
    expect(destaqueObservacao('PAR 4 DROP SET')).toEqual({ rotulo: 'PAR 4 DROP SET', detalhe: null })
    expect(destaqueObservacao('Escolher: esteira ou bike. 18 minutos.')).toEqual({
      rotulo: null,
      detalhe: 'Escolher: esteira ou bike. 18 minutos.',
    })
    expect(destaqueObservacao('  ')).toBeNull()
  })
})

describe('resumoPrescricao', () => {
  const base = { series_alvo: null, reps_min: null, reps_max: null, reps_alvo: null, tempo_seg: null, pausa_alvo_seg: null, cadencia_alvo: null }
  it('treino mostra séries × meta e pausa; fases de tempo mostram só o tempo', () => {
    expect(resumoPrescricao({ ...base, fase: 'treino', series_alvo: 4, reps_min: 8, reps_max: 12, pausa_alvo_seg: 60 })).toBe('4×8-12 reps · pausa 60s')
    expect(resumoPrescricao({ ...base, fase: 'treino', series_alvo: 3, tempo_seg: 52 })).toBe('3×52s')
    expect(resumoPrescricao({ ...base, fase: 'mobilidade', tempo_seg: 60 })).toBe('Mobilidade · 60s')
    expect(resumoPrescricao({ ...base, fase: 'cardio', tempo_seg: 1080 })).toBe('Cardio · 18 min')
  })
})

describe('moverNaFase', () => {
  const lista = [
    { id: 'm1', fase: 'mobilidade', ordem: 1 },
    { id: 'm2', fase: 'mobilidade', ordem: 2 },
    { id: 't1', fase: 'treino', ordem: 3 },
    { id: 't2', fase: 'treino', ordem: 4 },
    { id: 't3', fase: 'treino', ordem: 5 },
    { id: 'c1', fase: 'cardio', ordem: 6 },
  ]

  it('move dentro da fase e grava só quem mudou de posição', () => {
    const { lista: nova, mudancas } = moverNaFase(lista, 't3', 0)
    expect(nova.map((p) => p.id)).toEqual(['m1', 'm2', 't3', 't1', 't2', 'c1'])
    expect(mudancas).toEqual([
      { id: 't3', ordem: 3 },
      { id: 't1', ordem: 4 },
      { id: 't2', ordem: 5 },
    ])
  })

  it('posição fora do limite vai para a ponta; mesma posição não muda nada', () => {
    expect(moverNaFase(lista, 'm1', 99).lista.map((p) => p.id).slice(0, 2)).toEqual(['m2', 'm1'])
    expect(moverNaFase(lista, 't2', 1).mudancas).toEqual([])
  })

  it('ordens desalinhadas (buracos, repetidas) são renumeradas 1..n', () => {
    const baguncada = [
      { id: 'a', fase: 'treino', ordem: 10 },
      { id: 'b', fase: 'treino', ordem: 10 },
    ]
    expect(moverNaFase(baguncada, 'b', 0).mudancas).toEqual([
      { id: 'b', ordem: 1 },
      { id: 'a', ordem: 2 },
    ])
  })
})
