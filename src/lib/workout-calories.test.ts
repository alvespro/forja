import { describe, expect, it } from 'vitest'
import { estimateWorkoutCalories } from './workout-calories'

describe('estimateWorkoutCalories', () => {
  it('estima musculação usando peso, duração e RPE', () => {
    expect(estimateWorkoutCalories(3600, 80, 6)).toBe(420)
    expect(estimateWorkoutCalories(3600, 80, 9)).toBe(504)
  })
  it('não inventa uma estimativa sem peso ou duração', () => {
    expect(estimateWorkoutCalories(3600, null, 6)).toBeNull()
    expect(estimateWorkoutCalories(0, 80, 6)).toBeNull()
  })
})
