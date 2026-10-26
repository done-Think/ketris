import { describe, expect, it } from 'vitest'

import {
  calendarDateInTimeZone,
  calendarMonthDateRange,
  calendarMonthInTimeZone,
  dayBoundsInTimeZone,
  monthBoundsInTimeZone,
} from '../time-zone-calendar'

const iso = ({ start, end }: { start: Date; end: Date }) => ({
  start: start.toISOString(),
  end: end.toISOString(),
})

describe('dayBoundsInTimeZone', () => {
  it('usa o dia de São Paulo por padrão, de 00:00 a 00:00 do dia seguinte', () => {
    expect(iso(dayBoundsInTimeZone(new Date('2026-10-15T15:00:00.000Z')))).toEqual({
      start: '2026-10-15T03:00:00.000Z',
      end: '2026-10-16T03:00:00.000Z',
    })
  })

  it('às 23:30 em São Paulo (02:30 UTC do dia seguinte) ainda é o dia anterior', () => {
    expect(iso(dayBoundsInTimeZone(new Date('2026-10-16T02:30:00.000Z')))).toEqual({
      start: '2026-10-15T03:00:00.000Z',
      end: '2026-10-16T03:00:00.000Z',
    })
  })

  it('vira o mês e o ano no último dia', () => {
    expect(iso(dayBoundsInTimeZone(new Date('2026-12-31T20:00:00.000Z')))).toEqual({
      start: '2026-12-31T03:00:00.000Z',
      end: '2027-01-01T03:00:00.000Z',
    })
  })

  it('respeita outro fuso quando informado', () => {
    expect(
      iso(dayBoundsInTimeZone(new Date('2026-10-15T15:00:00.000Z'), 'America/New_York')),
    ).toEqual({
      start: '2026-10-15T04:00:00.000Z',
      end: '2026-10-16T04:00:00.000Z',
    })
  })
})

describe('monthBoundsInTimeZone', () => {
  it('continua calculando o mês de São Paulo', () => {
    expect(iso(monthBoundsInTimeZone(new Date('2026-11-01T02:59:59.999Z')))).toEqual({
      start: '2026-10-01T03:00:00.000Z',
      end: '2026-11-01T03:00:00.000Z',
    })
  })
})

describe('calendarMonthInTimeZone', () => {
  it('às 22h do dia 31 em São Paulo ainda é outubro, embora já seja novembro em UTC', () => {
    expect(calendarMonthInTimeZone(new Date('2026-11-01T01:00:00.000Z'))).toEqual({
      year: 2026,
      month: 9,
    })
  })
})

describe('calendarMonthDateRange', () => {
  it('cobre as datas do mês às 00:00 UTC, sem converter fuso', () => {
    expect(iso(calendarMonthDateRange({ year: 2026, month: 9 }))).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-11-01T00:00:00.000Z',
    })
  })

  it('desloca meses e vira o ano', () => {
    expect(iso(calendarMonthDateRange({ year: 2026, month: 0 }, -1))).toEqual({
      start: '2025-12-01T00:00:00.000Z',
      end: '2026-01-01T00:00:00.000Z',
    })
  })
})

describe('calendarDateInTimeZone', () => {
  it('devolve o dia de São Paulo como data à meia-noite UTC', () => {
    expect(calendarDateInTimeZone(new Date('2026-10-27T02:30:00.000Z')).toISOString()).toBe(
      '2026-10-26T00:00:00.000Z',
    )
    expect(calendarDateInTimeZone(new Date('2026-10-27T03:30:00.000Z')).toISOString()).toBe(
      '2026-10-27T00:00:00.000Z',
    )
  })
})
