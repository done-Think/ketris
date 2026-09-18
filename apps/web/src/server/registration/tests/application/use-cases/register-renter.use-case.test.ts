import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import type { User } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { RefreshTokenRepository } from '@server/auth/application/ports/refresh-token-repository.port'
import type { TokenService } from '@server/auth/application/ports/token-service.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

import { RenterTenantNotConfiguredError } from '../../../domain/errors'
import {
  RegisterRenterUseCase,
  RENTER_TENANT_SLUG,
} from '../../../application/use-cases/register-renter.use-case'

const renterTenant: TenantSummary = {
  id: 'renter-tenant-1',
  nome: 'Locatários Ketris',
  slug: RENTER_TENANT_SLUG,
  createdAt: new Date(),
}

const createdRenter: User = {
  id: 'renter-1',
  tenantId: renterTenant.id,
  nome: 'Maria Locatária',
  email: 'maria@ketris.dev',
  senhaHash: 'hash-novo',
  papel: 'RENTER',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: {
  findBySlug?: TenantRepository['findBySlug']
  findByEmailAndTenant?: UserRepository['findByEmailAndTenant']
}) {
  const tenantRepository: TenantRepository = {
    findBySlug: overrides?.findBySlug ?? vi.fn().mockResolvedValue(renterTenant),
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    searchByName: vi.fn(),
  }
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailAndTenant: overrides?.findByEmailAndTenant ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn().mockResolvedValue(createdRenter),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const tokenService: TokenService = {
    sign: vi.fn().mockResolvedValue('jwt-fake'),
    verify: vi.fn(),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn(),
  }

  return { tenantRepository, userRepository, passwordHasher, tokenService, refreshTokenRepository }
}

describe('RegisterRenterUseCase', () => {
  it('cria o RENTER no tenant compartilhado e já retorna sessão logada', async () => {
    const deps = createDeps()
    const useCase = new RegisterRenterUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    const result = await useCase.execute({
      fullName: 'Maria Locatária',
      email: 'maria@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(deps.tenantRepository.findBySlug).toHaveBeenCalledWith(RENTER_TENANT_SLUG)
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      tenantId: renterTenant.id,
      nome: 'Maria Locatária',
      email: 'maria@ketris.dev',
      senhaHash: 'hash-novo',
      papel: 'RENTER',
    })
    expect(result.user.papel).toBe('RENTER')
    expect(result.accessToken).toBe('jwt-fake')
  })

  it('lança RenterTenantNotConfiguredError quando o tenant compartilhado não existe (seed não rodou)', async () => {
    const deps = createDeps({ findBySlug: vi.fn().mockResolvedValue(null) })
    const useCase = new RegisterRenterUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(
      useCase.execute({
        fullName: 'Maria',
        email: 'maria@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(RenterTenantNotConfiguredError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('lança EmailAlreadyInUseError quando já existe um locatário com esse e-mail', async () => {
    const deps = createDeps({ findByEmailAndTenant: vi.fn().mockResolvedValue(createdRenter) })
    const useCase = new RegisterRenterUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await expect(
      useCase.execute({
        fullName: 'Maria',
        email: createdRenter.email,
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })
})
