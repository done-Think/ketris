import bcrypt from 'bcryptjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BcryptPasswordHasher } from '../../infrastructure/bcrypt-password-hasher'

const hasher = new BcryptPasswordHasher()
afterEach(() => vi.restoreAllMocks())

describe('limite de novas senhas sem afetar credenciais legadas', () => {
  it.each(['a'.repeat(73), 'é'.repeat(37), '😀'.repeat(19)])(
    'rejeita senha que excede 72 bytes antes do bcrypt',
    async (password) => {
      const hash = vi.spyOn(bcrypt, 'hash')
      await expect(hasher.hash(password)).rejects.toMatchObject({
        code: 'PASSWORD_TOO_LONG',
        status: 400,
      })
      expect(hash).not.toHaveBeenCalled()
    },
  )
  it.each(['a'.repeat(72), 'é'.repeat(36), '😀'.repeat(18)])(
    'aceita o limite exato em UTF-8 sem truncar',
    async (password) => {
      const result = await hasher.hash(password)
      expect(await hasher.compare(password, result)).toBe(true)
    },
  )
  it('preserva a verificação de senhas antigas maiores que o limite das senhas novas', async () => {
    const legacyPassword = 'a'.repeat(80)
    const legacyHash = await bcrypt.hash(legacyPassword, 4)
    expect(await hasher.compare(legacyPassword, legacyHash)).toBe(true)
  })
})
