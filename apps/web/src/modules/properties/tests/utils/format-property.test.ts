import { createFormatter } from 'next-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatPropertyRelativeDate, formatPropertyCurrency } from '../../utils/format-property'

describe('formatPropertyRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats relative dates using the selected locale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T12:00:00.000Z'))

    const value = '2026-10-06T11:28:00.000Z'

    expect(formatPropertyRelativeDate(value, createFormatter({ locale: 'pt-BR' }), true)).toBe(
      'Há 32 minutos',
    )
    expect(formatPropertyRelativeDate(value, createFormatter({ locale: 'en-US' }), true)).toBe(
      '32 minutes ago',
    )
    expect(formatPropertyRelativeDate(value, createFormatter({ locale: 'es-ES' }), true)).toBe(
      'Hace 32 minutos',
    )
  })
})

it('preserves cents when displaying a property value', () => {
  expect(formatPropertyCurrency(1500.5, createFormatter({ locale: 'pt-BR' }))).toBe('R$ 1.500,50')
  expect(formatPropertyCurrency(1500.59, createFormatter({ locale: 'pt-BR' }))).toBe('R$ 1.500,59')
  expect(formatPropertyCurrency(1500, createFormatter({ locale: 'pt-BR' }))).toBe('R$ 1.500')
})

it.each([
  ['pt-BR', 'R$ 1.234.567,50'],
  ['en-US', 'R$1,234,567.50'],
  ['es-ES', '1.234.567,50 BRL'],
])('formats BRL in %s without converting the registered value', (locale, expected) => {
  expect(formatPropertyCurrency(1234567.5, createFormatter({ locale }))).toBe(expected)
})
