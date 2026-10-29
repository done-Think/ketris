import { describe, expect, it } from 'vitest'

import {
  currentMonthRange,
  previousMonthDueDateRange,
  previousMonthRange,
  previousMonthSamePeriodRange,
} from '../../domain/agency-overview-periods'

const iso = ({ start, end }: { start: Date; end: Date }) => ({
  start: start.toISOString(),
  end: end.toISOString(),
})

describe('agency overview periods (America/Sao_Paulo)', () => {
  it('cobre o mês corrente inteiro, do dia 1 até o início do mês seguinte', () => {
    expect(iso(currentMonthRange(new Date('2026-10-13T17:00:00.000Z')))).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      end: '2026-11-01T03:00:00.000Z',
    })
  })

  it('às 22h do último dia em São Paulo ainda é o mês que está acabando', () => {
    expect(iso(currentMonthRange(new Date('2026-11-01T01:00:00.000Z')))).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      end: '2026-11-01T03:00:00.000Z',
    })
  })

  it('cobre o mês anterior inteiro, inclusive na virada de ano', () => {
    expect(iso(previousMonthRange(new Date('2026-01-15T12:00:00.000Z')))).toEqual({
      start: '2025-12-01T03:00:00.000Z',
      end: '2026-01-01T03:00:00.000Z',
    })
  })

  it('compara o mesmo trecho do mês anterior (dia 1 até o mesmo dia e hora)', () => {
    expect(iso(previousMonthSamePeriodRange(new Date('2026-10-13T17:30:00.000Z')))).toEqual({
      start: '2026-09-01T03:00:00.000Z',
      end: '2026-09-13T17:30:00.000Z',
    })
  })

  it('limita o trecho ao fim do mês anterior quando ele é mais curto', () => {
    expect(iso(previousMonthSamePeriodRange(new Date('2026-03-31T13:00:00.000Z')))).toEqual({
      start: '2026-02-01T03:00:00.000Z',
      end: '2026-03-01T03:00:00.000Z',
    })
  })

  it('vencimentos do mês anterior são comparados como datas de calendário', () => {
    expect(iso(previousMonthDueDateRange(new Date('2026-11-01T01:00:00.000Z')))).toEqual({
      start: '2026-09-01T00:00:00.000Z',
      end: '2026-10-01T00:00:00.000Z',
    })
  })
})
