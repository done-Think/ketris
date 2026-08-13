import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatDate,
  formatMonthlyCurrency,
  formatRelativeDate,
  getInitials,
} from './formatters'

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

  it('keeps calendar dates stable across local time zones', () => {
    expect(formatDate('2026-09-01T00:00:00.000Z')).toMatch(/^01/)
  })

  it('returns at most two initials', () => {
    expect(getInitials('Ricardo Mendes da Silva')).toBe('RM')
    expect(getInitials('  Ana  ')).toBe('A')
  })
})
