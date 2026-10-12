import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatDate,
  formatMonthlyCurrency,
  formatRelativeDate,
  getInitials,
} from '../../utils/formatters'

describe('CRM formatters', () => {
  it('formats values as Brazilian currency', () => {
    expect(formatCurrency(4800)).toContain('4.800')
    expect(formatMonthlyCurrency(4800)).toContain('/mês')
  })

  it('formats dates and relative times in Brazilian Portuguese', () => {
    const now = new Date('2026-08-12T12:00:00.000Z')

    expect(formatDate('2026-08-10T12:00:00.000Z')).toContain('2026')
    expect(formatRelativeDate('2026-08-12T10:00:00.000Z', now)).toContain('2 horas')
  })

  it('localizes BRL, dates, and monthly suffixes without converting currency', () => {
    expect(formatCurrency(10500.5, 'pt-BR')).toContain('10.500,5')
    expect(formatCurrency(10500.5, 'en-US')).toContain('10,500.5')
    expect(formatCurrency(10500.5, 'es-ES')).toContain('10.500,5')
    expect(formatMonthlyCurrency(2, 'en-US')).toContain('/month')
    expect(formatMonthlyCurrency(2, 'es-ES')).toContain('/mes')
    expect(formatDate('2026-08-10T12:00:00.000Z', 'en-US')).toContain('Aug')
    expect(formatDate('2026-08-10T12:00:00.000Z', 'es-ES')).toContain('ago')
  })

  it('localizes now, yesterday, and singular/plural relative time', () => {
    const now = new Date('2026-08-12T12:00:00.000Z')
    const hoursAgo = '2026-08-12T10:00:00.000Z'
    expect(formatRelativeDate(now, now, 'pt-BR')).toBe('agora')
    expect(formatRelativeDate(now, now, 'en-US')).toBe('now')
    expect(formatRelativeDate(now, now, 'es-ES')).toBe('ahora')
    expect(formatRelativeDate(hoursAgo, now, 'pt-BR')).toContain('2 horas')
    expect(formatRelativeDate(hoursAgo, now, 'en-US')).toBe('2 hours ago')
    expect(formatRelativeDate(hoursAgo, now, 'es-ES')).toContain('hace 2 horas')
    expect(formatRelativeDate('2026-08-11T12:00:00.000Z', now, 'en-US')).toBe('yesterday')
    expect(formatRelativeDate('2026-08-10T12:00:00.000Z', now, 'en-US')).toBe('2 days ago')
    expect(formatRelativeDate('2026-08-05T12:00:00.000Z', now, 'en-US')).toBe('1 week ago')
  })

  it('keeps calendar dates stable across local time zones', () => {
    expect(formatDate('2026-09-01T00:00:00.000Z')).toMatch(/^01/)
  })

  it('returns at most two initials', () => {
    expect(getInitials('Ricardo Mendes da Silva')).toBe('RM')
    expect(getInitials('  Ana  ')).toBe('A')
  })
})
