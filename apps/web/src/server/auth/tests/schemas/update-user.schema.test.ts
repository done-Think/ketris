import { describe, expect, it } from 'vitest'

import { updateUserRequestSchema } from '../../schemas/update-user.schema'

describe('updateUserRequestSchema', () => {
  it('accepts profile contact fields using the existing phone validation', () => {
    expect(updateUserRequestSchema.parse({ phone: '(35) 98888-7777', creci: ' 12345 ' })).toEqual({
      phone: '(35) 98888-7777',
      creci: '12345',
    })
    expect(updateUserRequestSchema.safeParse({ phone: '(35) 3333-4444' }).success).toBe(true)
    expect(updateUserRequestSchema.safeParse({ phone: '1234' }).success).toBe(false)
  })

  it('preserves nullable legacy contacts and validates an actual requested field', () => {
    expect(updateUserRequestSchema.parse({ phone: null, creci: null })).toEqual({
      phone: null,
      creci: null,
    })
    expect(updateUserRequestSchema.safeParse({}).success).toBe(false)
  })

  it('validates and normalizes CPF and CNPJ', () => {
    expect(
      updateUserRequestSchema.parse({ cpf: '529.982.247-25', cnpj: '11.222.333/0001-81' }),
    ).toEqual({ cpf: '52998224725', cnpj: '11222333000181' })
    expect(updateUserRequestSchema.safeParse({ cpf: '111.111.111-11' }).success).toBe(false)
    expect(updateUserRequestSchema.safeParse({ cnpj: '11.222.333/0001-82' }).success).toBe(false)
  })
})
