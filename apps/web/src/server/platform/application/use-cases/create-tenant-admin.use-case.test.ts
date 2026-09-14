import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import type { User } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'

import { TenantNotFoundError } from '../../domain/errors'
import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'
import { CreateTenantAdminUseCase } from './create-tenant-admin.use-case'

const tenant: TenantSummary = {
  id: 't1',
  nome: 'Imobiliária A',
  slug: 'imobiliaria-a',
  createdAt: new Date(),
}

const createdAdmin: User = {
  id: 'u1',
  tenantId: 't1',
  nome: 'Admin da Imobiliária',
  email: 'admin@imobiliaria-a.dev',
  senhaHash: 'hash-novo',
  papel: 'ADMIN',
  ativo: true,
}

function createDeps(overrides?: {
  findById?: TenantRepository['findById']
  findByEmailAndTenant?: UserRepository['findByEmailAndTenant']
}) {
  const tenantRepository: TenantRepository = {
    findBySlug: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(tenant),
    findMany: vi.fn(),
    create: vi.fn(),
  }
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailAndTenant: overrides?.findByEmailAndTenant ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn().mockResolvedValue(createdAdmin),
    update: vi.fn(),
    deactivate: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { tenantRepository, userRepository, passwordHasher }
}

describe('CreateTenantAdminUseCase', () => {
  it('cria o admin do tenant informado, sempre com papel ADMIN', async () => {
    const deps = createDeps()
    const useCase = new CreateTenantAdminUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    const result = await useCase.execute({
      tenantId: tenant.id,
      nome: 'Admin da Imobiliária',
      email: 'admin@imobiliaria-a.dev',
      password: 'senha-longa-123',
    })

    expect(result.papel).toBe('ADMIN')
    expect(deps.userRepository.create).toHaveBeenCalledWith({
      tenantId: tenant.id,
      nome: 'Admin da Imobiliária',
      email: 'admin@imobiliaria-a.dev',
      senhaHash: 'hash-novo',
      papel: 'ADMIN',
    })
  })

  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateTenantAdminUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        tenantId: 'inexistente',
        nome: 'X',
        email: 'x@x.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(TenantNotFoundError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('lança EmailAlreadyInUseError quando o e-mail já existe nesse tenant', async () => {
    const deps = createDeps({ findByEmailAndTenant: vi.fn().mockResolvedValue(createdAdmin) })
    const useCase = new CreateTenantAdminUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        tenantId: tenant.id,
        nome: 'X',
        email: createdAdmin.email,
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('permite criar mesmo quando o tenant já tem um admin (sem restrição de janela única)', async () => {
    const deps = createDeps()
    const useCase = new CreateTenantAdminUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        tenantId: tenant.id,
        nome: 'Segundo Admin',
        email: 'segundo@imobiliaria-a.dev',
        password: 'senha-longa-123',
      }),
    ).resolves.toBeDefined()
  })
})
