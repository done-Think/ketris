import { describe, expect, it } from 'vitest'

import { formatMoneyInput, parseMoneyInput } from '../../utils/money-input'
import { calculateMonthlyTotal } from '../../utils/plan-pricing'

describe('parseMoneyInput', () => {
  it('lê valores com centavos no formato de cada idioma', () => {
    expect(parseMoneyInput('49,99', 'pt-BR')).toBe(49.99)
    expect(parseMoneyInput('1.234,5', 'pt-BR')).toBe(1234.5)
    expect(parseMoneyInput('1,234.56', 'en-US')).toBe(1234.56)
    expect(parseMoneyInput(' 100 ', 'pt-BR')).toBe(100)
  })

  it('recusa texto, negativos e mais de duas casas decimais', () => {
    expect(parseMoneyInput('', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('abc', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('-5', 'pt-BR')).toBeNull()
    expect(parseMoneyInput('9,999', 'pt-BR')).toBeNull()
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
