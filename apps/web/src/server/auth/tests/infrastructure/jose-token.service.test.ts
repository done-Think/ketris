// @vitest-environment node

import { decodeJwt, SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '../../infrastructure/jose-token.service'

const secret = 'auth-claims-unit-test-secret'
const validClaims = { sub: 'user-1', tenantId: 'tenant-1', role: 'AGENT' }

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

  it('reads a legacy signed role without mutating or weakening the current claims', async () => {
    const token = await signClaims({
      sub: 'user-1',
      tenantId: 'tenant-1',
      papel: 'AGENT',
      sessionVersion: 4,
    })
    await expect(new JoseTokenService().verify(token)).resolves.toEqual({
      ...validClaims,
      sessionVersion: 4,
    })
    expect(decodeJwt(token)).toHaveProperty('papel', 'AGENT')
  })

  it('emits only the English role claim for new tokens', async () => {
    const token = await new JoseTokenService().sign({
      id: 'user-1',
      tenantId: 'tenant-1',
      name: 'User',
      email: 'user@example.test',
      role: 'AGENT',
      active: true,
      membershipApprovedAt: new Date(),
      sessionVersion: 4,
    })
    expect(decodeJwt(token)).toMatchObject({ role: 'AGENT', sessionVersion: 4 })
    expect(decodeJwt(token)).not.toHaveProperty('papel')
  })

  it.each([
    { ...validClaims, papel: 'OWNER' },
    { ...validClaims, role: null, papel: 'AGENT' },
    { sub: 'user-1', tenantId: 'tenant-1', papel: 'ADMIN' },
  ])('rejects conflicting or invalid legacy claims: %j', async (claims) => {
    await expect(new JoseTokenService().verify(await signClaims(claims))).rejects.toThrow()
  })

  it.each([
    { ...validClaims, sub: undefined },
    { ...validClaims, sub: '' },
    { ...validClaims, tenantId: undefined },
    { ...validClaims, tenantId: 123 },
    { ...validClaims, role: 'ADMIN' },
    { ...validClaims, role: ['OWNER'] },
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
