import { describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { UserListRepository } from '@server/auth/application/ports/user-list-repository.port'

import { TenantNotFoundError } from '../../../domain/errors'
import type { TenantSummary } from '../../../types/tenant-summary'
import type { TenantRepository } from '../../../application/ports/tenant-repository.port'
import { ListTenantUsersUseCase } from '../../../application/use-cases/list-tenant-users.use-case'

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
    papel: 'OWNER',
    ativo: true,
    vinculoAprovadoEm: new Date(),
  },
  {
    id: 'u2',
    tenantId: 't1',
    nome: 'Agente',
    email: 'agente@a.dev',
    senhaHash: 'h',
    papel: 'AGENT',
    ativo: true,
    vinculoAprovadoEm: new Date(),
  },
]

function createDeps(overrides?: { findById?: TenantRepository['findById'] }) {
  const tenantRepository: TenantRepository = {
    findBySlug: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(tenant),
    create: vi.fn(),
    searchByName: vi.fn(),
  }
  const userRepository: UserListRepository = {
    findPageByTenant: vi.fn().mockResolvedValue({ users, total: 7, page: 2, pageSize: 2 }),
  }

  return { tenantRepository, userRepository }
}

describe('ListTenantUsersUseCase', () => {
  it('retorna a página de usuários do tenant, incluindo contas OWNER, sem o hash da senha', async () => {
    const deps = createDeps()
    const useCase = new ListTenantUsersUseCase(deps.tenantRepository, deps.userRepository)

    const result = await useCase.execute({ tenantId: tenant.id, page: 2, pageSize: 2 })

    expect(deps.userRepository.findPageByTenant).toHaveBeenCalledWith(tenant.id, {
      page: 2,
      pageSize: 2,
    })
    expect(result).toMatchObject({ totalCount: 7, page: 2, pageSize: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.items.some((user) => user.papel === 'OWNER')).toBe(true)
    expect(result.items.every((user) => !('senhaHash' in user))).toBe(true)
  })

  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new ListTenantUsersUseCase(deps.tenantRepository, deps.userRepository)

    await expect(
      useCase.execute({ tenantId: 'inexistente', page: 1, pageSize: 20 }),
    ).rejects.toThrow(TenantNotFoundError)
    expect(deps.userRepository.findPageByTenant).not.toHaveBeenCalled()
  })
})
