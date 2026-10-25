// @vitest-environment node

import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '../../infrastructure/jose-token.service'

const secret = 'auth-claims-unit-test-secret'
const validClaims = { sub: 'user-1', tenantId: 'tenant-1', papel: 'AGENT' }

async function signClaims(claims: Record<string, unknown>, algorithm = 'HS256') {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: algorithm })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))
}

describe('JoseTokenService claims', () => {
  beforeEach(() => vi.stubEnv('AUTH_TOKEN_SECRET', secret))
  afterEach(() => vi.unstubAllEnvs())

  it('accepts valid claims and defaults legacy session versions to zero', async () => {
    const token = await signClaims(validClaims)
    await expect(new JoseTokenService().verify(token)).resolves.toEqual({
      ...validClaims,
      sessionVersion: 0,
    })
  })

  it.each([
    { ...validClaims, sub: undefined },
    { ...validClaims, sub: '' },
    { ...validClaims, tenantId: undefined },
    { ...validClaims, tenantId: 123 },
    { ...validClaims, papel: 'ADMIN' },
    { ...validClaims, papel: ['OWNER'] },
    { ...validClaims, sessionVersion: -1 },
    { ...validClaims, sessionVersion: 1.5 },
  ])('rejects malformed signed claims: %j', async (claims) => {
    await expect(new JoseTokenService().verify(await signClaims(claims))).rejects.toThrow()
  })

  it('rejects a token without expiration and a token using another algorithm', async () => {
    const token = await new SignJWT(validClaims)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(secret))
    await expect(new JoseTokenService().verify(token)).rejects.toThrow()
    await expect(
      new JoseTokenService().verify(await signClaims(validClaims, 'HS384')),
    ).rejects.toThrow()
  })
})
