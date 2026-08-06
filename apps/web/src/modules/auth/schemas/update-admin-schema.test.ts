import { describe, expect, it } from 'vitest'

import { updateAdminSchema } from './update-admin-schema'

describe('updateAdminSchema', () => {
  it('aceita nome e e-mail válidos', () => {
    const result = updateAdminSchema.safeParse({ nome: 'Admin', email: 'admin@ketris.dev' })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = updateAdminSchema.safeParse({ nome: 'Admin', email: 'nao-e-email' })

    expect(result.success).toBe(false)
  })

  it('rejeita nome ou e-mail vazios', () => {
    expect(updateAdminSchema.safeParse({ nome: '', email: 'admin@ketris.dev' }).success).toBe(false)
    expect(updateAdminSchema.safeParse({ nome: 'Admin', email: '' }).success).toBe(false)
  })
})
