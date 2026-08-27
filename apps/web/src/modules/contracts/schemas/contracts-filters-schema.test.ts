import { describe, expect, it } from 'vitest'

import { contractsFiltersDefaultValues, contractsFiltersSchema } from './contracts-filters-schema'

describe('contractsFiltersSchema', () => {
  it('accepts the contracts filters defaults', () => {
    const result = contractsFiltersSchema.safeParse(contractsFiltersDefaultValues)

    expect(result.success).toBe(true)
  })

  it('rejects unsupported filter values', () => {
    const result = contractsFiltersSchema.safeParse({
      ...contractsFiltersDefaultValues,
      status: 'Pendente',
      type: 'Venda',
      period: 'Ano inteiro',
    })

    expect(result.success).toBe(false)
  })
})
