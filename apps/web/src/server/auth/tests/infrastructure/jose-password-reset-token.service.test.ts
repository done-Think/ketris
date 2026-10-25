// @vitest-environment node

import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JosePasswordResetTokenService } from '../../infrastructure/jose-password-reset-token.service'

const secret = 'recovery-token-test-secret'
const key = new TextEncoder().encode(secret)
async function signClaims(claims: Record<string, unknown>, algorithm = 'HS256') {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: algorithm })
    .setExpirationTime('5m')
    .sign(key)
}

describe('JosePasswordResetTokenService', () => {
  beforeEach(() => vi.stubEnv('PASSWORD_RESET_TOKEN_SECRET', secret))
  afterEach(() => vi.unstubAllEnvs())
  it('binds signed reset tokens to a single user and session version', async () => {
    const service = new JosePasswordResetTokenService()
    const token = await service.issue('user-2', 7)
    await expect(service.verify(token)).resolves.toEqual({ userId: 'user-2', sessionVersion: 7 })
  })
  it('defaults a legacy missing version to zero', async () => {
    const token = await signClaims({ sub: 'legacy', purpose: 'password-reset' })
    await expect(new JosePasswordResetTokenService().verify(token)).resolves.toEqual({
      userId: 'legacy',
      sessionVersion: 0,
    })
  })
  it.each([
    { sub: '', purpose: 'password-reset', sessionVersion: 0 },
    { sub: 'user', purpose: 'access', sessionVersion: 0 },
    { sub: 'user', purpose: 'password-reset', sessionVersion: -1 },
    { sub: 'user', purpose: 'password-reset', sessionVersion: 1.5 },
    { sub: 'user', purpose: 'password-reset', sessionVersion: '0' },
  ])('rejects malformed signed claims: %j', async (claims) => {
    await expect(
      new JosePasswordResetTokenService().verify(await signClaims(claims)),
    ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' })
  })
  it('requires expiration and the expected algorithm', async () => {
    const claims = { sub: 'user', purpose: 'password-reset', sessionVersion: 0 }
    const noExpiry = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).sign(key)
    await expect(new JosePasswordResetTokenService().verify(noExpiry)).rejects.toThrow()
    await expect(
      new JosePasswordResetTokenService().verify(await signClaims(claims, 'HS384')),
    ).rejects.toThrow()
  })
})
