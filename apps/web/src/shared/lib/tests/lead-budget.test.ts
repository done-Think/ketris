import { describe, expect, it } from 'vitest'

import { formatLeadBudget } from '@shared/lib/utils/lead-budget'

describe('formatLeadBudget', () => {
  it.each([
    ['700000', 'R$ 700.000,00'],
    ['700000.75', 'R$ 700.000,75'],
    ['700.000,75', 'R$ 700.000,75'],
    ['R$ 700.000,75', 'R$ 700.000,75'],
    ['0', 'R$ 0,00'],
  ])('formats numeric budget %s without changing its amount', (value, expected) => {
    expect(formatLeadBudget(value, 'pt-BR').replace(/\u00a0/g, ' ')).toBe(expected)
  })

  it.each(['Até R$ 3.000', 'Entre R$ 200 mil e R$ 300 mil', 'Sob consulta', ''])(
    'preserves descriptive budget %s',
    (value) => {
      expect(formatLeadBudget(value)).toBe(value)
    },
  )

  it('uses the selected locale and the shared currency configuration', () => {
    expect(formatLeadBudget('700000.75', 'en-US')).toBe('R$700,000.75')
  })
})
