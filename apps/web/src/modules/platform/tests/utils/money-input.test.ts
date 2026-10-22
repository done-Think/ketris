import { describe, expect, it } from 'vitest'

import { formatMoneyInput, parseMoneyInput } from '../../utils/money-input'
import { calculateMonthlyTotal } from '../../utils/plan-pricing'

describe('parseMoneyInput', () => {
  it('lê valores com centavos no formato de cada idioma', () => {
    expect(parseMoneyInput('49,99', 'pt-BR')).toBe(49.99)
    expect(parseMoneyInput('1.234,5', 'pt-BR')).toBe(1234.5)
    expect(parseMoneyInput('1,234.56', 'en-US')).toBe(1234.56)
    expect(parseMoneyInput(' 100 ', 'pt-BR')).toBe(100)
    expect(parseMoneyInput('49,99', 'es-ES')).toBe(49.99)
    expect(parseMoneyInput('1499,00', 'es-ES')).toBe(1499)
    expect(parseMoneyInput('12.345,67', 'es-ES')).toBe(12345.67)
  })

  it('lê de volta o valor que formatMoneyInput mostrou no campo', () => {
    for (const locale of ['pt-BR', 'en-US', 'es-ES']) {
      for (const amount of [9.99, 49.99, 1499, 12345.67]) {
        expect(parseMoneyInput(formatMoneyInput(amount, locale), locale)).toBe(amount)
      }
    }
  })

  it('lê os centavos digitados com o separador do outro idioma', () => {
    expect(parseMoneyInput('49.99', 'pt-BR')).toBe(49.99)
    expect(parseMoneyInput('49.9', 'es-ES')).toBe(49.9)
    expect(parseMoneyInput('49,99', 'en-US')).toBe(49.99)
    expect(parseMoneyInput('1.234', 'pt-BR')).toBe(1234)
    expect(parseMoneyInput('1,234', 'en-US')).toBe(1234)
  })

  it('recusa texto, negativos e mais de duas casas decimais', () => {
    expect(parseMoneyInput('', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('abc', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('-5', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('9,999', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('1,2,3', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('12.34.567', 'pt-BR')).toBeNull()
  })

  it('formata com duas casas para edição', () => {
    expect(formatMoneyInput(49.9, 'pt-BR')).toBe('49,90')
    expect(formatMoneyInput(1234.5, 'en-US')).toBe('1,234.50')
  })
})

describe('calculateMonthlyTotal', () => {
  it('soma o preço base e cada unidade acima do limite, em centavos', () => {
    expect(calculateMonthlyTotal(99.99, 10, 9.99, 10)).toBe(99.99)
    expect(calculateMonthlyTotal(99.99, 10, 9.99, 12)).toBe(119.97)
    expect(calculateMonthlyTotal(199.99, 10, 19.99, 13)).toBe(259.96)
  })
})
