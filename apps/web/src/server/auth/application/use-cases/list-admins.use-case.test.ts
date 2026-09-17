import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { ListAdminsUseCase } from './list-admins.use-case'

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    tenantId: 't1',
    nome: 'Usuário',
    email: 'user@ketris.dev',
    senhaHash: 'hash',
    papel: 'ADMIN',
    ativo: true,
    ...overrides,
  }
}

describe('ListAdminsUseCase', () => {
  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const userRepository = { findManyByTenant: vi.fn() } as unknown as UserRepository
    const useCase = new ListAdminsUseCase(userRepository)

    await expect(useCase.execute({ actorTenantId: 't1', actorPapel: 'AGENT' })).rejects.toThrow(
      'Apenas administradores podem listar administradores.',
    )
  })

  it('retorna apenas os usuários com papel ADMIN do tenant, sem senhaHash', async () => {
    const admin = buildUser({ id: 'a1', papel: 'ADMIN' })
    const agent = buildUser({ id: 'a2', papel: 'AGENT' })
    const userRepository = {
      findManyByTenant: vi.fn().mockResolvedValue([admin, agent]),
    } as unknown as UserRepository
    const useCase = new ListAdminsUseCase(userRepository)

    const result = await useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN' })

    expect(result).toEqual([
      {
        id: 'a1',
        tenantId: 't1',
        nome: 'Usuário',
        email: 'user@ketris.dev',
        papel: 'ADMIN',
        ativo: true,
      },
    ])
    expect(userRepository.findManyByTenant).toHaveBeenCalledWith('t1')
  })
})
