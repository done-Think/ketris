import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { GetAdminUseCase } from './get-admin.use-case'

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'a1',
    tenantId: 't1',
    nome: 'Admin',
    email: 'admin@ketris.dev',
    senhaHash: 'hash',
    papel: 'ADMIN',
    ativo: true,
    ...overrides,
  }
}

describe('GetAdminUseCase', () => {
  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const userRepository = { findById: vi.fn() } as unknown as UserRepository
    const useCase = new GetAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'AGENT', adminId: 'a1' }),
    ).rejects.toThrow('Apenas administradores podem consultar administradores.')
  })

  it('lança UserNotFoundError quando o alvo não existe', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository
    const useCase = new GetAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'nope' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança UserNotFoundError quando o alvo é de outro tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ tenantId: 'outro' })),
    } as unknown as UserRepository
    const useCase = new GetAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'a1' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança UserNotFoundError quando o alvo não é ADMIN', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ papel: 'AGENT' })),
    } as unknown as UserRepository
    const useCase = new GetAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'a1' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('retorna o administrador sem senhaHash quando encontrado', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
    } as unknown as UserRepository
    const useCase = new GetAdminUseCase(userRepository)

    const result = await useCase.execute({
      actorTenantId: 't1',
      actorPapel: 'ADMIN',
      adminId: 'a1',
    })

    expect(result).toEqual({
      id: 'a1',
      tenantId: 't1',
      nome: 'Admin',
      email: 'admin@ketris.dev',
      papel: 'ADMIN',
      ativo: true,
    })
  })
})
