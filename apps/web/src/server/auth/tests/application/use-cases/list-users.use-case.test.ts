import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import type { UserListRepository } from '../../../application/ports/user-list-repository.port'
import { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case'

const admin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  name: 'Admin',
  email: 'admin@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'OWNER',
  active: true,
  membershipApprovedAt: new Date(),
}

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  name: 'Proprietário',
  email: 'owner@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'OWNER',
  active: true,
  membershipApprovedAt: new Date(),
}

const agent: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  name: 'Agente',
  email: 'agent@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'AGENT',
  active: false,
  membershipApprovedAt: new Date(),
}

function createDeps() {
  const userRepository: UserListRepository = {
    findPageByTenant: vi
      .fn()
      .mockResolvedValue({ users: [admin, owner, agent], total: 3, page: 1, pageSize: 25 }),
  }

  return { userRepository }
}

describe('ListUsersUseCase', () => {
  it('lista todos os usuários do tenant', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', actorRole: 'OWNER' })

    expect(result.users.map((user) => user.id)).toEqual([admin.id, owner.id, agent.id])
    expect(result.users.every((user) => !('passwordHash' in user))).toBe(true)
    expect(deps.userRepository.findPageByTenant).toHaveBeenCalledWith('tenant-1', {
      page: 1,
      pageSize: 25,
      pendingApproval: undefined,
    })
  })

  it('lança ForbiddenError quando o ator não é o dono da imobiliária', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorRole: 'AGENT' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.findPageByTenant).not.toHaveBeenCalled()
  })
})
