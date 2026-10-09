import { describe, expect, it } from 'vitest'

import {
  formatIntegerCurrencyInput,
  parseIntegerCurrencyInput,
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
})
