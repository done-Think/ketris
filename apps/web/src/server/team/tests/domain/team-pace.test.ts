import { describe, expect, it } from 'vitest'

import { median, monthElapsedFraction, teamMemberPace } from '../../domain/team-pace'

describe('ritmo da meta mensal', () => {
  const start = new Date('2026-10-01T03:00:00.000Z')
  const end = new Date('2026-11-01T03:00:00.000Z')

  it('mede a fração do mês que já passou, limitada entre 0 e 1', () => {
    expect(monthElapsedFraction(new Date('2026-10-16T15:00:00.000Z'), start, end)).toBeCloseTo(
      0.5,
      1,
    )
    expect(monthElapsedFraction(new Date('2026-09-20T00:00:00.000Z'), start, end)).toBe(0)
    expect(monthElapsedFraction(new Date('2026-12-01T00:00:00.000Z'), start, end)).toBe(1)
  })

  it('compara as vendas com o esperado até hoje', () => {
    expect(teamMemberPace(6, 10, 0.5)).toEqual({
      status: 'AHEAD',
      expectedSales: 5,
      goalProgress: 60,
    })
    expect(teamMemberPace(4, 10, 0.5).status).toBe('ON_TRACK')
    expect(teamMemberPace(3, 10, 0.5).status).toBe('ATTENTION')
  })

  it('não inventa status sem meta', () => {
    expect(teamMemberPace(3, null, 0.5)).toEqual({
      status: 'NO_GOAL',
      expectedSales: null,
      goalProgress: null,
    })
  })

  it('calcula a mediana arredondada', () => {
    expect(median([])).toBeNull()
    expect(median([30, 10, 20])).toBe(20)
    expect(median([10, 20, 31, 40])).toBe(26)
  })
})
