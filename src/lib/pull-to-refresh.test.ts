import { describe, expect, it } from 'vitest'

import { PULL_MAX, PULL_THRESHOLD, pullDistance } from './pull-to-refresh'

describe('pullDistance', () => {
  it('não anda ao arrastar para cima', () => {
    expect(pullDistance(-40)).toBe(0)
  })
  it('aplica resistência de 50%', () => {
    expect(pullDistance(100)).toBe(50)
  })
  it('para no máximo', () => {
    expect(pullDistance(1000)).toBe(PULL_MAX)
  })
  it('é preciso arrastar o dobro do limiar para disparar', () => {
    expect(pullDistance(PULL_THRESHOLD * 2)).toBe(PULL_THRESHOLD)
    expect(pullDistance(PULL_THRESHOLD * 2 - 2)).toBeLessThan(PULL_THRESHOLD)
  })
})
