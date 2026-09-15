import { describe, expect, it } from 'vitest'

import {
  alongamentosRelacionados,
  buildExerciseRow,
  duracaoRotinaMin,
  mapCategoria,
  mapEquipamento,
  mapGrupoMuscular,
  montarRotina,
  normalizeExercise,
  ROTINAS_PADRAO,
  type Candidato,
} from './exercisedb'

const BENCH = {
  exerciseId: 'exr_41n2hxnFMotsXTj3',
  name: 'Bench Press',
  imageUrl: 'https://cdn/x.webp',
  imageUrls: { '360p': 'https://cdn/360.webp', '480p': 'https://cdn/480.webp' },
  equipments: ['BARBELL'],
  bodyParts: ['CHEST'],
  exerciseType: 'STRENGTH',
  targetMuscles: ['PECTORALIS MAJOR STERNAL HEAD'],
  secondaryMuscles: ['ANTERIOR DELTOID', 'TRICEPS BRACHII'],
  videoUrl: 'https://cdn/bench.mp4',
  overview: 'The Bench Press is a classic strength exercise.',
  instructions: ['Grip the barbell.', 'Lower it to your chest.'],
  exerciseTips: ['Avoid Arching Your Back: keep contact.'],
  variations: ['Decline Bench Press: lower chest.'],
  keywords: ['chest workout'],
  relatedExerciseIds: ['exr_2'],
}

describe('ExerciseDB → FORJA', () => {
  it('normaliza caixa alta, 480p e campos opcionais', () => {
    const ex = normalizeExercise(BENCH)!
    expect(ex).toMatchObject({
      exercisedb_id: 'exr_41n2hxnFMotsXTj3',
      bodyParts: ['chest'],
      equipments: ['barbell'],
      exerciseType: 'strength',
      imageUrl: 'https://cdn/480.webp',
      tips: ['Avoid Arching Your Back: keep contact.'],
    })
    expect(normalizeExercise({ name: 'sem id' })).toBeNull()
  })

  it('categorias do ExerciseDB em pt-BR', () => {
    expect(mapCategoria('STRETCHING')).toBe('alongamento')
    expect(mapCategoria('rehabilitation')).toBe('reabilitacao')
    expect(mapCategoria('plyometrics')).toBe('pliometria')
    expect(mapCategoria('yoga')).toBeNull()
  })

  it('grupo muscular: upper arms decide bíceps × tríceps pelo alvo', () => {
    expect(mapGrupoMuscular(['chest'])).toBe('peito')
    expect(mapGrupoMuscular(['upper arms'], ['triceps brachii'])).toBe('tríceps')
    expect(mapGrupoMuscular(['upper arms'], ['biceps brachii'])).toBe('bíceps')
    expect(mapGrupoMuscular(['waist'])).toBe('abdômen')
    expect(mapGrupoMuscular(['lower legs'])).toBe('panturrilha')
  })

  it('equipamento em pt-BR', () => {
    expect(mapEquipamento(['body weight'])).toBe('peso corporal')
    expect(mapEquipamento(['dumbbell'])).toBe('halteres')
  })

  it('linha usa a tradução quando houver e guarda o original', () => {
    const ex = normalizeExercise(BENCH)!
    const row = buildExerciseRow(ex, { nome: 'Supino Reto', instrucoes: ['Segure a barra.', 'Desça até o peito.'], dicas: [], variacoes: [] })
    expect(row).toMatchObject({
      grupo_muscular: 'peito',
      categoria: 'forca',
      equipamento: 'barra',
      video_url: 'https://cdn/bench.mp4',
      instrucoes: ['Segure a barra.', 'Desça até o peito.'],
      dicas_execucao: ['Avoid Arching Your Back: keep contact.'], // sem tradução → original
      fonte: 'exercisedb',
    })
    expect(row.exercisedb_data.original_name).toBe('Bench Press')
  })
})

const cand = (id: string, categoria: string, texto: string, equipments = ['body weight']): Candidato => ({
  id,
  nome: id,
  categoria,
  equipamento: null,
  grupo_muscular: null,
  exercisedb_data: { original_name: texto, body_parts: [], target_muscles: [], equipments },
})

describe('rotinas de mobilidade', () => {
  it('pós-corrida: um exercício por região, só alongamento sem equipamento', () => {
    const def = ROTINAS_PADRAO.find((r) => r.contexto === 'pos_treino')!
    const ids = montarRotina(def, [
      cand('ham', 'alongamento', 'seated hamstring stretch'),
      cand('calf', 'alongamento', 'standing calf stretch'),
      cand('banda', 'alongamento', 'glute stretch with band', ['band']),
      cand('glute', 'alongamento', 'lying glute stretch'),
      cand('mob', 'mobilidade', 'hip flexor mobility'),
      cand('hipflex', 'alongamento', 'kneeling hip flexor stretch'),
    ])
    expect(ids).toEqual(['calf', 'hipflex', 'ham', 'glute'])
  })

  it('completa com o que houver quando faltam regiões e nunca repete', () => {
    const def = ROTINAS_PADRAO.find((r) => r.contexto === 'manha')!
    const ids = montarRotina(def, [cand('a', 'mobilidade', 'arm circles shoulder'), cand('b', 'alongamento', 'wrist stretch')])
    expect(ids).toEqual(['a', 'b'])
  })

  it('alongamentos relacionados ao grupo, mobilidade primeiro', () => {
    const lista = [
      cand('along-ombro', 'alongamento', 'cross body shoulder stretch'),
      cand('mob-ombro', 'mobilidade', 'arm circles shoulder'),
      cand('quad', 'alongamento', 'standing quadricep stretch'),
      cand('forca', 'forca', 'shoulder press'),
    ]
    expect(alongamentosRelacionados('peito', lista).map((c) => c.id)).toEqual(['mob-ombro', 'along-ombro'])
    expect(alongamentosRelacionados('pernas', lista).map((c) => c.id)).toEqual(['quad'])
    expect(alongamentosRelacionados(null, lista)).toEqual([])
  })

  it('duração arredonda para cima', () => {
    expect(duracaoRotinaMin(5, 45)).toBe(4)
    expect(duracaoRotinaMin(4, 50)).toBe(4)
    expect(duracaoRotinaMin(0, 45)).toBe(1)
  })
})
