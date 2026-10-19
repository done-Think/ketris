import { describe, expect, it } from 'vitest'

import {
  currentMonthRange,
  previousMonthRange,
  previousMonthSamePeriodRange,
} from '../../domain/agency-overview-periods'

describe('agency overview periods', () => {
  it('cobre o mês corrente inteiro, do dia 1 até o início do mês seguinte', () => {
    expect(currentMonthRange(new Date(2026, 9, 13, 14, 0))).toEqual({
      start: new Date(2026, 9, 1),
      end: new Date(2026, 10, 1),
    })
  })

  it('cobre o mês anterior inteiro, inclusive na virada de ano', () => {
    expect(previousMonthRange(new Date(2026, 0, 15, 9, 0))).toEqual({
      start: new Date(2025, 11, 1),
      end: new Date(2026, 0, 1),
    })
  })

  it('compara o mesmo trecho do mês anterior (dia 1 até o mesmo dia e hora)', () => {
    expect(previousMonthSamePeriodRange(new Date(2026, 9, 13, 14, 30))).toEqual({
      start: new Date(2026, 8, 1),
      end: new Date(2026, 8, 13, 14, 30),
    })
  })

  it('limita o trecho ao fim do mês anterior quando ele é mais curto', () => {
    expect(previousMonthSamePeriodRange(new Date(2026, 2, 31, 10, 0))).toEqual({
      start: new Date(2026, 1, 1),
      end: new Date(2026, 2, 1),
    })
  })

  it('compara janeiro com o mesmo trecho de dezembro do ano anterior', () => {
    expect(previousMonthSamePeriodRange(new Date(2027, 0, 15, 9, 0))).toEqual({
      start: new Date(2026, 11, 1),
      end: new Date(2026, 11, 15, 9, 0),
    })
  })

  it('limita o trecho quando o mês anterior tem 30 dias e hoje é dia 31', () => {
    expect(previousMonthSamePeriodRange(new Date(2026, 9, 31, 23, 0))).toEqual({
      start: new Date(2026, 8, 1),
      end: new Date(2026, 9, 1),
    })
  })

  it('usa o dia 29 de fevereiro em ano bissexto', () => {
    expect(previousMonthSamePeriodRange(new Date(2028, 2, 29, 10, 0))).toEqual({
      start: new Date(2028, 1, 1),
      end: new Date(2028, 1, 29, 10, 0),
    })
  })

  it('cobre o último instante do mês sem passar para o mês seguinte', () => {
    const lastInstant = new Date(2026, 9, 31, 23, 59, 59, 999)

    expect(currentMonthRange(lastInstant)).toEqual({
      start: new Date(2026, 9, 1),
      end: new Date(2026, 10, 1),
    })
    expect(previousMonthRange(lastInstant)).toEqual({
      start: new Date(2026, 8, 1),
      end: new Date(2026, 9, 1),
    })
  })

  it('retorna um trecho vazio no primeiro instante do mês', () => {
    const range = previousMonthSamePeriodRange(new Date(2026, 9, 1, 0, 0))

    expect(range.start).toEqual(new Date(2026, 8, 1))
    expect(range.end).toEqual(range.start)
  })
})
