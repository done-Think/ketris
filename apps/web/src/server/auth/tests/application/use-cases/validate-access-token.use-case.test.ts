import { describe, expect, it, vi } from 'vitest'

import { ValidateAccessTokenUseCase } from '../../../application/use-cases/validate-access-token.use-case'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import type { TokenService } from '../../../application/ports/token-service.port'
import type { User } from '../../../domain/user.entity'

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana',
  email: 'ana@example.test',
  passwordHash: 'hash',
  role: 'AGENT',
  active: true,
  membershipApprovedAt: new Date(),
  tenantStatus: 'ACTIVE',
  emailVerifiedAt: new Date(),
  sessionVersion: 2,
}
const payload = { sub: user.id, tenantId: user.tenantId, role: user.role, sessionVersion: 2 }

function buildUseCase(currentUser: User | null, claims = payload) {
  const users = { findById: vi.fn().mockResolvedValue(currentUser) } as unknown as UserRepository
  const tokens: TokenService = { sign: vi.fn(), verify: vi.fn().mockResolvedValue(claims) }
  return new ValidateAccessTokenUseCase(tokens, users)
}

describe('ValidateAccessTokenUseCase', () => {
  it.each(['ACTIVE', 'TRIAL'] as const)(
    'accepts a current session in tenant %s',
    async (tenantStatus) => {
      await expect(
        buildUseCase({ ...user, tenantStatus }).execute('signed-token'),
      ).resolves.toEqual(payload)
    },
  )

  it.each([
    null,
    { ...user, active: false },
    { ...user, tenantStatus: 'SUSPENDED' as const },
    { ...user, tenantStatus: 'CANCELED' as const },
    { ...user, membershipApprovedAt: null },
    { ...user, emailVerifiedAt: null },
    { ...user, tenantId: 'other-tenant' },
    { ...user, role: 'RENTER' as const },
    { ...user, sessionVersion: 3 },
  ])(
    'rejects a session when the current account no longer permits access: %j',
    async (currentUser) => {
      await expect(buildUseCase(currentUser).execute('signed-token')).rejects.toThrow()
    },
  )

  it('keeps a legacy session with version zero valid until its account version changes', async () => {
    const legacyClaims = { ...payload, sessionVersion: 0 }
    await expect(
      buildUseCase({ ...user, sessionVersion: 0 }, legacyClaims).execute('legacy-token'),
    ).resolves.toEqual(legacyClaims)
    await expect(
      buildUseCase({ ...user, sessionVersion: 1 }, legacyClaims).execute('legacy-token'),
    ).rejects.toThrow()
  })
})
