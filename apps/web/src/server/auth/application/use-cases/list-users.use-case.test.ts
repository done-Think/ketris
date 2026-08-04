import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { ListUsersUseCase } from './list-users.use-case'

const admin: User = {
  id: 'admin-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'ADMIN',
  ativo: true,
}

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  nome: 'Proprietário',
  email: 'owner@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
}

const agent: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  nome: 'Agente',
  email: 'agent@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'AGENT',
  ativo: false,
}

function createDeps(findManyByTenant?: UserRepository['findManyByTenant']) {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailAndTenant: vi.fn(),
    findManyByTenant: findManyByTenant ?? vi.fn().mockResolvedValue([admin, owner, agent]),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }

  return { userRepository }
}

describe('ListUsersUseCase', () => {
  it('lista os usuários do tenant sem incluir administradores', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' })

    expect(result).toHaveLength(2)
    expect(result.every((user) => user.papel !== 'ADMIN')).toBe(true)
    expect(result.map((user) => user.id)).toEqual([owner.id, agent.id])
    expect(result.every((user) => !('senhaHash' in user))).toBe(true)
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new ListUsersUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.findManyByTenant).not.toHaveBeenCalled()
  })
})
