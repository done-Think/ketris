import { describe, expect, it } from 'vitest'

import { createLeadDefaultValues, createLeadSchema } from '../../schemas/create-lead-schema'

const schema = createLeadSchema((key) => key)

const validLeadValues = {
  ...createLeadDefaultValues,
  name: 'Ana Costa',
  phone: '(11) 99999-9999',
  email: 'ana@ketris.com',
  interest: 'Apartamento 3 quartos nos Jardins',
  budget: 'R$ 4.5M',
  source: 'Marketplace',
}

describe('createLeadSchema', () => {
  it('accepts a valid lead creation payload', () => {
    expect(schema.safeParse(validLeadValues).success).toBe(true)
  })

  it('rejects an empty email', () => {
    expect(schema.safeParse({ ...validLeadValues, email: '' }).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = schema.safeParse({ ...validLeadValues, email: 'email-invalido' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe('emailInvalid')
  })

  it('rejects missing required contact and interest data', () => {
    expect(
      schema.safeParse({
        ...validLeadValues,
        budget: '',
        interest: '',
        name: '',
        phone: '',
      }).success,
    ).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createLeadSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ ...validLeadValues, name: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
