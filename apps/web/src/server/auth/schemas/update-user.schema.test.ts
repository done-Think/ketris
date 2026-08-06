import { describe, expect, it } from 'vitest'

import { updateUserRequestSchema } from './update-user.schema'

describe('updateUserRequestSchema', () => {
  it('aceita atualização parcial só do nome', () => {
    const result = updateUserRequestSchema.safeParse({ nome: 'Novo Nome' })

    expect(result.success).toBe(true)
  })

  it('aceita atualização de papel para OWNER ou AGENT', () => {
    expect(updateUserRequestSchema.safeParse({ papel: 'OWNER' }).success).toBe(true)
    expect(updateUserRequestSchema.safeParse({ papel: 'AGENT' }).success).toBe(true)
  })

  it('rejeita papel ADMIN — não é possível promover usuário por esta rota', () => {
    const result = updateUserRequestSchema.safeParse({ papel: 'ADMIN' })

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
