import { describe, expect, it } from 'vitest'

import { contactFormSchema, contactTypeSchema } from '../../schemas/contact-schema'

describe('contact schemas', () => {
  it.each(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])('accepts the supported type %s', (type) => {
    expect(contactTypeSchema.parse(type)).toBe(type)
  })

  it('rejects a contact type that is not supported by the API', () => {
    expect(contactTypeSchema.safeParse('INQUILINO').success).toBe(false)
  })

  it('accepts a complete form', () => {
    const result = contactFormSchema.safeParse({
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '(11) 90000-0000',
      type: 'LOCATARIO',
      notes: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing name', () => {
    expect(
      contactFormSchema.safeParse({
        name: '   ',
        email: 'maria@example.com',
        phone: '',
        type: 'LOCATARIO',
        notes: '',
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(
      contactFormSchema.safeParse({
        name: 'Maria Silva',
        email: 'not-an-email',
        phone: '',
        type: 'LOCATARIO',
        notes: '',
      }).success,
    ).toBe(false)
  })
})
