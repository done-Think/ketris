import { describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { RefreshTokenRepository } from '@server/auth/application/ports/refresh-token-repository.port'
import type { TokenService } from '@server/auth/application/ports/token-service.port'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

import type { RegistrationRepository } from '../../../application/ports/registration-repository.port'
import { RegisterTenantOwnerUseCase } from '../../../application/use-cases/register-tenant-owner.use-case'

const tenant: TenantSummary = {
  id: 'tenant-1',
  nome: 'Imobiliária Nova',
  slug: 'imobiliaria-nova',
  createdAt: new Date(),
}

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Dona da Imobiliária',
  email: 'dona@ketris.dev',
  senhaHash: 'hash-novo',
  papel: 'ADMIN',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: {
  createTenantWithAdmin?: RegistrationRepository['createTenantWithAdmin']
}) {
  const registrationRepository: RegistrationRepository = {
    createTenantWithAdmin:
      overrides?.createTenantWithAdmin ?? vi.fn().mockResolvedValue({ tenant, user }),
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

  return { registrationRepository, passwordHasher, tokenService, refreshTokenRepository }
}

describe('RegisterTenantOwnerUseCase', () => {
  it('cria o tenant e o admin, e já retorna sessão logada', async () => {
    const deps = createDeps()
    const useCase = new RegisterTenantOwnerUseCase(
      deps.registrationRepository,
      deps.passwordHasher,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    const result = await useCase.execute({
      fullName: 'Dona da Imobiliária',
      companyName: 'Imobiliária Nova',
      email: 'dona@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('senha-longa-123')
    expect(deps.registrationRepository.createTenantWithAdmin).toHaveBeenCalledWith({
      tenantName: 'Imobiliária Nova',
      adminName: 'Dona da Imobiliária',
      email: 'dona@ketris.dev',
      senhaHash: 'hash-novo',
    })
    expect(result.user.papel).toBe('ADMIN')
    expect(result.accessToken).toBe('jwt-fake')
    expect(typeof result.refreshToken).toBe('string')
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, tenantId: user.tenantId }),
    )
  })

  it('usa o próprio nome como nome do tenant quando não há companyName (autônomo/proprietário)', async () => {
    const deps = createDeps()
    const useCase = new RegisterTenantOwnerUseCase(
      deps.registrationRepository,
      deps.passwordHasher,
      deps.tokenService,
      deps.refreshTokenRepository,
    )

    await useCase.execute({
      fullName: 'Corretor Autônomo',
      email: 'corretor@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(deps.registrationRepository.createTenantWithAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ tenantName: 'Corretor Autônomo' }),
    )
  })
})
