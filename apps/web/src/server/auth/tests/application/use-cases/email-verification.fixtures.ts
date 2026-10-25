import { vi } from 'vitest'
import type { Mailer } from '@server/shared/email/mailer.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import type { EmailVerificationRepository } from '../../../application/ports/email-verification-repository.port'
import type { TokenService } from '../../../application/ports/token-service.port'
import type { RefreshTokenRepository } from '../../../application/ports/refresh-token-repository.port'
import type { User } from '../../../domain/user.entity'
import type { EmailVerificationRecord } from '../../../types/email-verification'
import { hashPasswordResetCode } from '../../../domain/password-reset-code'

export const verificationCode = '123456'
export function account(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    tenantId: 't1',
    nome: 'Ana',
    email: 'ana@example.test',
    senhaHash: 'hash-nunca-exposto',
    papel: 'OWNER',
    ativo: true,
    vinculoAprovadoEm: new Date(),
    tenantStatus: 'ACTIVE',
    emailVerifiedAt: new Date(),
    sessionVersion: 0,
    ...overrides,
  }
}
export function verificationRecord(
  overrides: Partial<EmailVerificationRecord> = {},
): EmailVerificationRecord {
  return {
    id: 'proof-1',
    userId: 'u1',
    tenantId: 't1',
    purpose: 'EMAIL_CHANGE',
    targetEmail: 'next@example.test',
    codeHash: hashPasswordResetCode(verificationCode),
    attempts: 0,
    expiresAt: new Date(Date.now() + 600000),
    createdAt: new Date(),
    consumedAt: null,
    ...overrides,
  }
}
export function verificationDeps() {
  const users: UserRepository = {
    findById: vi.fn().mockResolvedValue(account()),
    findByEmail: vi.fn().mockResolvedValue(null),
    findManyByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const codes: EmailVerificationRepository = {
    findLatest: vi.fn().mockResolvedValue(verificationRecord()),
    findById: vi.fn().mockResolvedValue(verificationRecord()),
    replace: vi.fn().mockResolvedValue(verificationRecord()),
    incrementAttempts: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  }
  const mailer: Mailer = { send: vi.fn().mockResolvedValue(undefined) }
  const tokens: TokenService = {
    sign: vi.fn().mockResolvedValue('access-test-only'),
    verify: vi.fn(),
  }
  const refresh: RefreshTokenRepository = {
    create: vi.fn(),
    rotate: vi.fn(),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn(),
  }
  return { users, codes, mailer, tokens, refresh }
}
