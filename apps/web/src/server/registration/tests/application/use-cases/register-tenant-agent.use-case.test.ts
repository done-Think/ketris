import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import type { User } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'
import type { TenantSummary } from '@server/platform/domain/tenant-summary.entity'

import { AgencyNotFoundError } from '../../../domain/errors'
import { RegisterTenantAgentUseCase } from '../../../application/use-cases/register-tenant-agent.use-case'

const agency: TenantSummary = {
  id: 'agency-1',
  nome: 'Imobiliária Existente',
  slug: 'imobiliaria-existente',
  createdAt: new Date(),
}

const createdAgent: User = {
  id: 'agent-1',
  tenantId: agency.id,
  nome: 'Novo Corretor',
  email: 'corretor@ketris.dev',
  senhaHash: 'hash-novo',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: null,
}

function createDeps(overrides?: {
  findById?: TenantRepository['findById']
  findByEmail?: UserRepository['findByEmail']
}) {
  const tenantRepository: TenantRepository = {
    findBySlug: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(agency),
    findMany: vi.fn(),
    create: vi.fn(),
    searchByName: vi.fn(),
  }
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn().mockResolvedValue(createdAgent),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { tenantRepository, userRepository, passwordHasher }
}

describe('RegisterTenantAgentUseCase', () => {
  it('cria um AGENT pendente de aprovação na imobiliária escolhida, sem emitir token', async () => {
    const deps = createDeps()
    const useCase = new RegisterTenantAgentUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    const result = await useCase.execute({
      agencyId: agency.id,
      fullName: 'Novo Corretor',
      email: 'corretor@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(deps.userRepository.create).toHaveBeenCalledWith({
      tenantId: agency.id,
      nome: 'Novo Corretor',
      email: 'corretor@ketris.dev',
      senhaHash: 'hash-novo',
      papel: 'AGENT',
      vinculoAprovadoEm: null,
    })
    expect(result).toEqual({ email: createdAgent.email })
  })

  it('lança AgencyNotFoundError quando a imobiliária não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new RegisterTenantAgentUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        agencyId: 'inexistente',
        fullName: 'Novo Corretor',
        email: 'corretor@ketris.dev',
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(AgencyNotFoundError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })

  it('lança EmailAlreadyInUseError quando já existe uma conta (em qualquer tenant) com esse e-mail', async () => {
    const deps = createDeps({ findByEmail: vi.fn().mockResolvedValue(createdAgent) })
    const useCase = new RegisterTenantAgentUseCase(
      deps.tenantRepository,
      deps.userRepository,
      deps.passwordHasher,
    )

    await expect(
      useCase.execute({
        agencyId: agency.id,
        fullName: 'Novo Corretor',
        email: createdAgent.email,
        password: 'senha-longa-123',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.create).not.toHaveBeenCalled()
  })
})
