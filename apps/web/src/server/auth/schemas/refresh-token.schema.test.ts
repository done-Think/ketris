import { describe, expect, it } from 'vitest'

import { refreshTokenRequestSchema } from './refresh-token.schema'

describe('refreshTokenRequestSchema', () => {
  it('aceita um refreshToken não vazio', () => {
    const result = refreshTokenRequestSchema.safeParse({ refreshToken: 'algum-token' })

    expect(result.success).toBe(true)
  })

  it('rejeita refreshToken vazio', () => {
    const result = refreshTokenRequestSchema.safeParse({ refreshToken: '' })

    expect(result.success).toBe(false)
  })

  it('rejeita payload sem refreshToken', () => {
    const result = refreshTokenRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})
