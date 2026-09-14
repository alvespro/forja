import { describe, expect, it } from 'vitest'

import { pickTodaysWorkout } from './workout-rotation'

const w = (id: string, ordem: number) => ({ id, ordem })
const treinos = [w('A', 1), w('B', 2), w('C', 3)]

describe('pickTodaysWorkout', () => {
  it('sem histórico começa pelo primeiro', () => {
    expect(pickTodaysWorkout(treinos, null)?.id).toBe('A')
  })

  it('segue para o próximo da rotação', () => {
    expect(pickTodaysWorkout(treinos, 'B')?.id).toBe('C')
  })

  it('volta ao início depois do último', () => {
    expect(pickTodaysWorkout(treinos, 'C')?.id).toBe('A')
  })

  it('treino anterior removido recomeça do primeiro', () => {
    expect(pickTodaysWorkout(treinos, 'X')?.id).toBe('A')
  })

  it('sem treinos ativos retorna null', () => {
    expect(pickTodaysWorkout([], 'A')).toBeNull()
  })
})
