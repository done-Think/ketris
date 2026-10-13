import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '../../../lib/utils/format'

describe('format', () => {
  it('formata moeda em BRL', () => {
    expect(formatCurrency(1500)).toContain('1.500')
  })

  it('formata data no padrão brasileiro', () => {
    expect(formatDate('2025-01-15')).toBe('15/01/2025')
  })

  it('mantém BRL e localiza moeda e data nos três idiomas', () => {
    expect(formatCurrency(10500.5, 'pt-BR')).toContain('10.500,50')
    expect(formatCurrency(10500.5, 'en-US')).toContain('10,500.50')
    expect(formatCurrency(10500.5, 'es-ES')).toContain('10.500,50')
    expect(formatDate('2025-01-15', undefined, 'en-US')).toBe('01/15/2025')
    expect(formatDate('2025-01-15', undefined, 'es-ES')).toBe('15/01/2025')
  })
})
