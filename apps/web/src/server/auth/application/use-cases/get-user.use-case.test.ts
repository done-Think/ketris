import { describe, expect, it, vi } from 'vitest'

import { UserNotFoundError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { GetUserUseCase } from './get-user.use-case'

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  nome: 'Proprietário',
  email: 'owner@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
}

const adminEmOutroTenant: User = {
  id: 'admin-2',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'ADMIN',
  ativo: true,
}

function createDeps(findById?: UserRepository['findById']) {
  const userRepository: UserRepository = {
    findById: findById ?? vi.fn().mockResolvedValue(owner),
    findByEmail: vi.fn(),
    findByEmailAndTenant: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  }

  return { userRepository }
}

describe('GetUserUseCase', () => {
  it('retorna o usuário quando ele existe no tenant do ator e não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new GetUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: owner.id,
    })

    expect(result.id).toBe(owner.id)
    expect(result).not.toHaveProperty('senhaHash')
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', userId: owner.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('lança UserNotFoundError quando o usuário não existe', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN', userId: 'inexistente' }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('lança UserNotFoundError quando o usuário é de outro tenant', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ ...owner, tenantId: 'tenant-2' }))
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN', userId: owner.id }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('lança UserNotFoundError (opaco) quando o alvo é um ADMIN', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(adminEmOutroTenant))
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        userId: adminEmOutroTenant.id,
      }),
    ).rejects.toThrow(UserNotFoundError)
  })
})
