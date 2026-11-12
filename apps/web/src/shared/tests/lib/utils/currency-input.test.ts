import { describe, expect, it } from 'vitest'

import {
  formatIntegerCurrencyInput,
  formatMoneyInput,
  parseIntegerCurrencyInput,
  parseMoneyInput,
} from '../../../lib/utils/currency-input'

describe('currency input utils', () => {
  it('formats integer values with the selected locale separators', () => {
    expect(formatIntegerCurrencyInput(365000000, 'pt-BR')).toBe('365.000.000')
    expect(formatIntegerCurrencyInput(365000000, 'en-US')).toBe('365,000,000')
  })

  it('parses integer values using the selected locale separators', () => {
    expect(parseIntegerCurrencyInput('365.000.000', 'pt-BR')).toBe(365000000)
    expect(parseIntegerCurrencyInput('365,000,000', 'en-US')).toBe(365000000)
  })

  it('keeps only the integer part when a decimal separator is typed', () => {
    expect(parseIntegerCurrencyInput('1.500,50', 'pt-BR')).toBe(1500)
  })

  it('formats money with two decimals in the selected locale and hides zero', () => {
    expect(formatMoneyInput(2300.5, 'pt-BR')).toBe('2.300,50')
    expect(formatMoneyInput(2300.5, 'en-US')).toBe('2,300.50')
    expect(formatMoneyInput(0, 'pt-BR')).toBe('')
    expect(formatMoneyInput('abc', 'pt-BR')).toBe('')
  })

  it('reads typed digits as cents, dropping leading zeros and extra digits', () => {
    expect(parseMoneyInput('0123')).toBe(1.23)
    expect(parseMoneyInput('2.300,50')).toBe(2300.5)
    expect(parseMoneyInput('R$ 0,00')).toBe(0)
    expect(parseMoneyInput('')).toBe(0)
    expect(parseMoneyInput('99999999999999')).toBe(9999999999.99)
  })
})
