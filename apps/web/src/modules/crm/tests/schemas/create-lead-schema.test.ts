import { describe, expect, it } from 'vitest'

import { createLeadDefaultValues, createLeadSchema } from '../../schemas/create-lead-schema'
import { property } from '../fixtures/property'

const schema = createLeadSchema((key) => key)

const validLeadValues = {
  ...createLeadDefaultValues,
  name: 'Ana Costa',
  phone: '(11) 99999-9999',
  email: 'ana@ketris.com',
  property,
  budget: 'R$ 4.5M',
  source: 'MARKETPLACE',
}

describe('createLeadSchema', () => {
  it('rejects typed search text that has not been selected as a property', () => {
    expect(schema.safeParse({ ...validLeadValues, property: 'Apartamento' }).success).toBe(false)
  })
  it('accepts a valid lead creation payload', () => {
    expect(schema.safeParse(validLeadValues).success).toBe(true)
  })

  it('accepts an empty email until conversion', () => {
    expect(schema.safeParse({ ...validLeadValues, email: '' }).success).toBe(true)
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
        property: null,
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
