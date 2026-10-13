import { describe, expect, it } from 'vitest'

import { createUpdateAdminSchema } from '../../schemas/update-admin-schema'

const schema = createUpdateAdminSchema((key) => key)

describe('updateAdminSchema', () => {
  it('aceita nome e e-mail válidos', () => {
    const result = schema.safeParse({ name: 'Admin', email: 'admin@ketris.dev' })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = schema.safeParse({ name: 'Admin', email: 'nao-e-email' })

    expect(result.success).toBe(false)
  })

  it('rejeita nome ou e-mail vazios', () => {
    expect(schema.safeParse({ name: '', email: 'admin@ketris.dev' }).success).toBe(false)
    expect(schema.safeParse({ name: 'Admin', email: '' }).success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createUpdateAdminSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ name: '', email: 'admin@ketris.dev' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
