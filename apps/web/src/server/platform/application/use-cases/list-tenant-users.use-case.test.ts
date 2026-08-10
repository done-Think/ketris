import { describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'

import { TenantNotFoundError } from '../../domain/errors'
import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'
import { ListTenantUsersUseCase } from './list-tenant-users.use-case'

const tenant: TenantSummary = {
  id: 't1',
  nome: 'Imobiliária A',
  slug: 'imobiliaria-a',
  createdAt: new Date(),
}

const users: User[] = [
  {
    id: 'u1',
    tenantId: 't1',
    nome: 'Admin',
    email: 'admin@a.dev',
    senhaHash: 'h',
    papel: 'ADMIN',
    ativo: true,
  },
  {
    id: 'u2',
    tenantId: 't1',
    nome: 'Agente',
    email: 'agente@a.dev',
    senhaHash: 'h',
    papel: 'AGENT',
    ativo: true,
  },
]

function createDeps(overrides?: { findById?: TenantRepository['findById'] }) {
  const tenantRepository: TenantRepository = {
    findBySlug: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(tenant),
    findMany: vi.fn(),
    create: vi.fn(),
  }
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailAndTenant: vi.fn(),
    findManyByTenant: vi.fn().mockResolvedValue(users),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }

  return { tenantRepository, userRepository }
}

describe('ListTenantUsersUseCase', () => {
  it('retorna todos os usuários do tenant, incluindo contas ADMIN', async () => {
    const deps = createDeps()
    const useCase = new ListTenantUsersUseCase(deps.tenantRepository, deps.userRepository)

    const result = await useCase.execute({ tenantId: tenant.id })

    expect(result).toHaveLength(2)
    expect(result.some((user) => user.papel === 'ADMIN')).toBe(true)
    expect(result.every((user) => !('senhaHash' in user))).toBe(true)
  })

  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new ListTenantUsersUseCase(deps.tenantRepository, deps.userRepository)

    await expect(useCase.execute({ tenantId: 'inexistente' })).rejects.toThrow(TenantNotFoundError)
    expect(deps.userRepository.findManyByTenant).not.toHaveBeenCalled()
  })
})
