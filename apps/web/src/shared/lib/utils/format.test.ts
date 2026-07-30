import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './format'

describe('format', () => {
  it('formata moeda em BRL', () => {
    expect(formatCurrency(1500)).toContain('1.500')
  })

  it('formata data no padrão brasileiro', () => {
    expect(formatDate('2025-01-15')).toBe('15/01/2025')
  })
})
