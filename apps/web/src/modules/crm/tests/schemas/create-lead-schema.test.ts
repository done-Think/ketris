import { describe, expect, it } from 'vitest'

import { createLeadDefaultValues, createLeadSchema } from '../../schemas/create-lead-schema'

const validLeadValues = {
  ...createLeadDefaultValues,
  name: 'Ana Costa',
  phone: '(11) 99999-9999',
  email: 'ana@ketris.com',
  interest: 'Apartamento 3 quartos nos Jardins',
  budget: 'R$ 4.5M',
  source: 'Marketplace',
  broker: 'Marina Costa',
}

describe('createLeadSchema', () => {
  it('accepts a valid lead creation payload', () => {
    expect(createLeadSchema.safeParse(validLeadValues).success).toBe(true)
  })

  it('accepts an empty optional email', () => {
    expect(createLeadSchema.safeParse({ ...validLeadValues, email: '' }).success).toBe(true)
  })

  it('rejects missing required contact and interest data', () => {
    expect(
      createLeadSchema.safeParse({
        ...validLeadValues,
        budget: '',
        interest: '',
        name: '',
        phone: '',
      }).success,
    ).toBe(false)
  })

  it('rejects an unsupported lead stage', () => {
    expect(createLeadSchema.safeParse({ ...validLeadValues, stage: 'Fechado' }).success).toBe(false)
  })
})
