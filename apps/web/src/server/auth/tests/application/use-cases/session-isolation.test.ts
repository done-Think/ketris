// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import type {
  RefreshTokenRepository,
  NewRefreshToken,
  StoredRefreshToken,
} from '../../../application/ports/refresh-token-repository.port'
import { LoginUseCase } from '../../../application/use-cases/login.use-case'
import { LogoutUseCase } from '../../../application/use-cases/logout.use-case'
import { ValidateSessionTokensUseCase } from '../../../application/use-cases/validate-session-tokens.use-case'
import { JoseTokenService } from '../../../infrastructure/jose-token.service'

afterEach(() => vi.unstubAllEnvs())

it('keeps the owner session valid when another user logs in and out through a separate session', async () => {
  vi.stubEnv('AUTH_TOKEN_SECRET', 'session-isolation-synthetic-key-for-tests')
  const owner: User = {
    id: 'owner',
    tenantId: 'agency',
    name: 'Agency',
    email: 'owner@example.test',
    passwordHash: 'test-hash',
    role: 'OWNER',
    active: true,
    membershipApprovedAt: new Date(),
  }
  const candidate: User = {
    ...owner,
    id: 'candidate',
    email: 'candidate@example.test',
    role: 'AGENT',
  }
  const users: UserRepository = {
    findManyByEmail: async (email) => [owner, candidate].filter((user) => user.email === email),
    findById: async (id) => [owner, candidate].find((user) => user.id === id) ?? null,
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const rows = new Map<string, StoredRefreshToken>()
  const repository: RefreshTokenRepository = {
    create: async (row: NewRefreshToken) => {
      rows.set(row.tokenHash, { id: row.tokenHash, userId: row.userId, tenantId: row.tenantId })
    },
    findValidByTokenHash: async (hash) => rows.get(hash) ?? null,
    rotate: vi.fn(),
    revokeAllForUser: vi.fn(),
    revokeById: async (id) => {
      rows.delete(id)
    },
  }
  const tokens = new JoseTokenService()
  const login = new LoginUseCase(
    users,
    { compare: async () => true, hash: vi.fn() },
    tokens,
    repository,
  )
  const validate = new ValidateSessionTokensUseCase(tokens, repository)
  const agencySession = await login.execute({ email: owner.email, password: 'synthetic-password' })
  const candidateSession = await login.execute({
    email: candidate.email,
    password: 'synthetic-password',
  })
  expect(agencySession.refreshToken).not.toBe(candidateSession.refreshToken)
  expect(
    await validate.execute(agencySession.accessToken, agencySession.refreshToken),
  ).toMatchObject({ sub: owner.id })
  expect(
    await validate.execute(candidateSession.accessToken, candidateSession.refreshToken),
  ).toMatchObject({ sub: candidate.id })
  await new LogoutUseCase(repository).execute({ refreshToken: candidateSession.refreshToken })
  expect(
    await validate.execute(agencySession.accessToken, agencySession.refreshToken),
  ).toMatchObject({ sub: owner.id })
  await expect(
    validate.execute(candidateSession.accessToken, candidateSession.refreshToken),
  ).rejects.toThrow()
  expect(repository.revokeAllForUser).not.toHaveBeenCalled()
})
