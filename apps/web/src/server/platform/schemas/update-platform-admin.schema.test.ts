import { describe, expect, it } from 'vitest'

import { updatePlatformAdminRequestSchema } from './update-platform-admin.schema'

describe('updatePlatformAdminRequestSchema', () => {
  it('aceita quando apenas nome é informado', () => {
    expect(updatePlatformAdminRequestSchema.safeParse({ nome: 'Novo Nome' }).success).toBe(true)
  })

  it('aceita quando apenas email é informado', () => {
    expect(updatePlatformAdminRequestSchema.safeParse({ email: 'novo@ketris.dev' }).success).toBe(
      true,
    )
  })

  it('rejeita corpo vazio (nenhum campo informado)', () => {
    expect(updatePlatformAdminRequestSchema.safeParse({}).success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    expect(updatePlatformAdminRequestSchema.safeParse({ email: 'nao-e-email' }).success).toBe(false)
  })
})
