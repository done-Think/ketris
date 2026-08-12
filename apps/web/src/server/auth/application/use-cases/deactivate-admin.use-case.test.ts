import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/user.entity'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'
import { DeactivateAdminUseCase } from './deactivate-admin.use-case'

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

describe('DeactivateAdminUseCase', () => {
  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const userRepository = {} as unknown as UserRepository
    const refreshTokenRepository = {} as unknown as RefreshTokenRepository
    const useCase = new DeactivateAdminUseCase(userRepository, refreshTokenRepository)

    await expect(
      useCase.execute({ actorId: 'x', actorTenantId: 't1', actorPapel: 'AGENT', adminId: 'a1' }),
    ).rejects.toThrow('Apenas administradores podem desativar administradores.')
  })

  it('lança CannotDeactivateSelfError quando o ator tenta se autodesativar', async () => {
    const userRepository = {} as unknown as UserRepository
    const refreshTokenRepository = {} as unknown as RefreshTokenRepository
    const useCase = new DeactivateAdminUseCase(userRepository, refreshTokenRepository)

    await expect(
      useCase.execute({ actorId: 'a1', actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'a1' }),
    ).rejects.toThrow('Você não pode desativar sua própria conta.')
  })

  it('lança UserNotFoundError quando o alvo não é um ADMIN do mesmo tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ papel: 'AGENT' })),
    } as unknown as UserRepository
    const refreshTokenRepository = {} as unknown as RefreshTokenRepository
    const useCase = new DeactivateAdminUseCase(userRepository, refreshTokenRepository)

    await expect(
      useCase.execute({ actorId: 'ator', actorTenantId: 't1', actorPapel: 'ADMIN', adminId: 'a1' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('desativa o admin e revoga os refresh tokens dele', async () => {
    const deactivated = buildUser({ ativo: false })
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
      deactivate: vi.fn().mockResolvedValue(deactivated),
    } as unknown as UserRepository
    const refreshTokenRepository = {
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    } as unknown as RefreshTokenRepository
    const useCase = new DeactivateAdminUseCase(userRepository, refreshTokenRepository)

    const result = await useCase.execute({
      actorId: 'ator',
      actorTenantId: 't1',
      actorPapel: 'ADMIN',
      adminId: 'a1',
    })

    expect(userRepository.deactivate).toHaveBeenCalledWith('a1')
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('a1')
    expect(result.ativo).toBe(false)
  })
})
