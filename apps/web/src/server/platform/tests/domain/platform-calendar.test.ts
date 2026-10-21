import { describe, expect, it } from 'vitest'

import { monthBoundsInTimeZone } from '../../domain/platform-calendar'

const bounds = (reference: string, timeZone?: string) => {
  const { start, end } = monthBoundsInTimeZone(new Date(reference), timeZone)

  return { start: start.toISOString(), end: end.toISOString() }
}

describe('monthBoundsInTimeZone', () => {
  it('usa o mês de São Paulo por padrão, de 00:00 do dia 1 a 00:00 do mês seguinte', () => {
    expect(bounds('2026-10-15T15:00:00.000Z')).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      end: '2026-11-01T03:00:00.000Z',
    })
  })

  it('no fim da noite do último dia ainda é o mês que está acabando', () => {
    expect(bounds('2026-11-01T02:59:59.999Z')).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      end: '2026-11-01T03:00:00.000Z',
    })
  })

  it('exatamente às 00:00 do dia 1 já é o mês novo', () => {
    expect(bounds('2026-11-01T03:00:00.000Z')).toEqual({
      start: '2026-11-01T03:00:00.000Z',
      end: '2026-12-01T03:00:00.000Z',
    })
  })

  it('vira o ano de dezembro para janeiro', () => {
    expect(bounds('2026-12-31T23:00:00.000Z')).toEqual({
      start: '2026-12-01T03:00:00.000Z',
      end: '2027-01-01T03:00:00.000Z',
    })
  })

  it('respeita o horário de verão quando o fuso tem (São Paulo em 2018, Nova York)', () => {
    // Brazil still had daylight saving time in 2018 (UTC-2 from November 4th).
    expect(bounds('2018-11-20T12:00:00.000Z')).toEqual({
      start: '2018-11-01T03:00:00.000Z',
      end: '2018-12-01T02:00:00.000Z',
    })
    expect(bounds('2026-03-20T12:00:00.000Z', 'America/New_York')).toEqual({
      start: '2026-03-01T05:00:00.000Z',
      end: '2026-04-01T04:00:00.000Z',
    })
  })

  it('funciona em fusos à frente de UTC', () => {
    expect(bounds('2026-09-30T16:00:00.000Z', 'Asia/Tokyo')).toEqual({
      start: '2026-09-30T15:00:00.000Z',
      end: '2026-10-31T15:00:00.000Z',
    })
  })

  it('acerta a meia-noite quando o horário muda no próprio dia 1 (Sydney, 1º/10/2028 e 1º/04/2029)', () => {
    // Daylight saving starts on 2028-10-01 at 02:00 and ends on 2029-04-01 at 03:00, so the offset
    // at midnight differs from the offset a few hours later on the same day.
    expect(bounds('2028-10-15T00:00:00.000Z', 'Australia/Sydney')).toEqual({
      start: '2028-09-30T14:00:00.000Z',
      end: '2028-10-31T13:00:00.000Z',
    })
    expect(bounds('2029-04-15T00:00:00.000Z', 'Australia/Sydney')).toEqual({
      start: '2029-03-31T13:00:00.000Z',
      end: '2029-04-30T14:00:00.000Z',
    })
  })
})
