import { describe, expect, it } from 'vitest'
import { estimateWorkoutCalories } from './workout-calories'

describe('estimateWorkoutCalories', () => {
  it('estima musculação usando peso, duração e RPE', () => {
    expect(estimateWorkoutCalories(3600, 80, ['peito', 'tríceps'])).toBe(340)
    expect(estimateWorkoutCalories(3600, 80, ['pernas'])).toBe(480)
  })
  it('não inventa uma estimativa sem peso ou duração', () => {
    expect(estimateWorkoutCalories(3600, null, ['peito'])).toBeNull()
    expect(estimateWorkoutCalories(0, 80, ['peito'])).toBeNull()
  })
})
