import { describe, expect, it } from 'vitest'

import { generateRefreshToken, hashRefreshToken, refreshTokenExpiryDate } from './refresh-token'

describe('generateRefreshToken', () => {
  it('gera um token de alta entropia (128 caracteres hex)', () => {
    const token = generateRefreshToken()

    expect(token).toMatch(/^[0-9a-f]{128}$/)
  })

  it('gera tokens diferentes a cada chamada', () => {
    const a = generateRefreshToken()
    const b = generateRefreshToken()

    expect(a).not.toBe(b)
  })
})

describe('hashRefreshToken', () => {
  it('é determinístico (mesmo input, mesmo hash)', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'))
  })

  it('não retorna o valor original', () => {
    expect(hashRefreshToken('abc')).not.toBe('abc')
  })

  it('produz hashes diferentes para inputs diferentes', () => {
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('xyz'))
  })
})

describe('refreshTokenExpiryDate', () => {
  it('retorna uma data 30 dias no futuro a partir da referência informada', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')

    const expiry = refreshTokenExpiryDate(now)

    expect(expiry.toISOString()).toBe('2026-01-31T00:00:00.000Z')
  })
})
