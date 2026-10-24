import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ListUsersUseCase } from '../../../application/use-cases/list-users.use-case'

const admin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  nome: 'Proprietário',
  email: 'owner@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

const agent: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  nome: 'Agente',
  email: 'agent@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'AGENT',
  ativo: false,
  vinculoAprovadoEm: new Date(),
}

function createDeps(findManyByTenant?: UserRepository['findManyByTenant']) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findManyByTenant: findManyByTenant ?? vi.fn().mockResolvedValue([admin, owner, agent]),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }

  return { userRepository }
}

describe('ListUsersUseCase', () => {
  it('lista todos os usuários do tenant', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER' })

    expect(result.map((user) => user.id)).toEqual([admin.id, owner.id, agent.id])
    expect(result.every((user) => !('senhaHash' in user))).toBe(true)
  })

  it('lança ForbiddenError quando o ator não é o dono da imobiliária', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.findManyByTenant).not.toHaveBeenCalled()
  })
})
