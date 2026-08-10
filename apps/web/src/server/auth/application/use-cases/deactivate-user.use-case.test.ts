import { describe, expect, it, vi } from 'vitest'

import { CannotDeactivateSelfError, UserNotFoundError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'
import { DeactivateUserUseCase } from './deactivate-user.use-case'

const agent: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  nome: 'Agente',
  email: 'agent@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'AGENT',
  ativo: true,
}

function createDeps(overrides?: { findById?: UserRepository['findById'] }) {
  const userRepository: UserRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(agent),
    findByEmail: vi.fn(),
    findByEmailAndTenant: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn().mockResolvedValue({ ...agent, ativo: false }),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn(),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  }

  return { userRepository, refreshTokenRepository }
}

describe('DeactivateUserUseCase', () => {
  it('desativa o usuário e revoga todos os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.refreshTokenRepository)

    const result = await useCase.execute({
      actorId: 'admin-1',
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: agent.id,
    })

    expect(result.ativo).toBe(false)
    expect(deps.userRepository.deactivate).toHaveBeenCalledWith(agent.id)
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(agent.id)
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.refreshTokenRepository)

    await expect(
      useCase.execute({
        actorId: 'agent-2',
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        userId: agent.id,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.deactivate).not.toHaveBeenCalled()
  })

  it('lança CannotDeactivateSelfError quando o ator tenta desativar a própria conta', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.refreshTokenRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        userId: 'admin-1',
      }),
    ).rejects.toThrow(CannotDeactivateSelfError)
    expect(deps.userRepository.deactivate).not.toHaveBeenCalled()
  })

  it('lança UserNotFoundError quando o alvo não existe, é de outro tenant, ou é ADMIN', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.refreshTokenRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        userId: 'inexistente',
      }),
    ).rejects.toThrow(UserNotFoundError)
    expect(deps.refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled()
  })
})
