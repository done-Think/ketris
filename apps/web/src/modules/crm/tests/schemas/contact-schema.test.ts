import { describe, expect, it } from 'vitest'

import { contactTypeSchema, createContactFormSchema } from '../../schemas/contact-schema'

const schema = createContactFormSchema((key) => key)

describe('contact schemas', () => {
  it.each(['PROPRIETARIO', 'LOCATARIO', 'CORRETOR'])('accepts the supported type %s', (type) => {
    expect(contactTypeSchema.parse(type)).toBe(type)
  })

  it('rejects a contact type that is not supported by the API', () => {
    expect(contactTypeSchema.safeParse('INQUILINO').success).toBe(false)
  })

  it('accepts a complete form', () => {
    const result = schema.safeParse({
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
      schema.safeParse({
        name: '   ',
        email: 'maria@example.com',
        phone: '',
        type: 'LOCATARIO',
        notes: '',
      }).success,
    ).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = schema.safeParse({
      name: 'Maria Silva',
      email: 'not-an-email',
      phone: '',
      type: 'LOCATARIO',
      notes: '',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe('emailInvalid')
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createContactFormSchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      name: '',
      email: 'maria@example.com',
      phone: '',
      type: 'LOCATARIO',
      notes: '',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
