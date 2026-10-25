import { describe, expect, it } from 'vitest'

import { updateUserRequestSchema } from '../../schemas/update-user.schema'

describe('updateUserRequestSchema', () => {
  it('aceita atualização parcial só do nome', () => {
    const result = updateUserRequestSchema.safeParse({ name: 'Novo Nome' })

    expect(result.success).toBe(true)
  })

  it('aceita atualização de role para OWNER ou AGENT', () => {
    expect(updateUserRequestSchema.safeParse({ role: 'OWNER' }).success).toBe(true)
    expect(updateUserRequestSchema.safeParse({ role: 'AGENT' }).success).toBe(true)
  })

  it('rejeita role ADMIN, que não existe para usuários de imobiliária', () => {
    const result = updateUserRequestSchema.safeParse({ role: 'ADMIN' })

    expect(result.success).toBe(false)
  })

  it('rejeita corpo vazio (nenhum campo informado)', () => {
    const result = updateUserRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = updateUserRequestSchema.safeParse({ email: 'nao-e-email' })

    expect(result.success).toBe(false)
  })
})
