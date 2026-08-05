import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { UpdateAdminUseCase } from './update-admin.use-case'

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

describe('UpdateAdminUseCase', () => {
  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const userRepository = {} as unknown as UserRepository
    const useCase = new UpdateAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'AGENT', adminId: 'a1', nome: 'X' }),
    ).rejects.toThrow('Apenas administradores podem editar administradores.')
  })

  it('lança UserNotFoundError quando o alvo não é um ADMIN do mesmo tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ papel: 'AGENT' })),
    } as unknown as UserRepository
    const useCase = new UpdateAdminUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'a1', nome: 'X' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança EmailAlreadyInUseError quando o novo e-mail já existe no tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
      findByEmailAndTenant: vi.fn().mockResolvedValue(buildUser({ id: 'outro' })),
    } as unknown as UserRepository
    const useCase = new UpdateAdminUseCase(userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 't1',
        actorPapel: 'ADMIN',
        adminId: 'a1',
        email: 'novo@ketris.dev',
      }),
    ).rejects.toThrow('Este e-mail já está em uso.')
  })

  it('atualiza nome/e-mail e retorna sem senhaHash', async () => {
    const updated = buildUser({ nome: 'Admin Atualizado' })
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
      findByEmailAndTenant: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(updated),
    } as unknown as UserRepository
    const useCase = new UpdateAdminUseCase(userRepository)

    const result = await useCase.execute({
      actorTenantId: 't1',
      actorPapel: 'ADMIN',
      adminId: 'a1',
      nome: 'Admin Atualizado',
    })

    expect(userRepository.update).toHaveBeenCalledWith('a1', {
      nome: 'Admin Atualizado',
      email: undefined,
    })
    expect(result).not.toHaveProperty('senhaHash')
    expect(result.nome).toBe('Admin Atualizado')
  })
})
