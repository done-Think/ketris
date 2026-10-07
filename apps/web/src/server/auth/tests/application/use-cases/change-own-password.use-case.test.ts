import { describe, expect, it, vi } from 'vitest'

import type { PasswordHasher } from '../../../application/ports/password-hasher.port'
import type { RefreshTokenRepository } from '../../../application/ports/refresh-token-repository.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ChangeOwnPasswordUseCase } from '../../../application/use-cases/change-own-password.use-case'

function createDeps() {
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }
  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn(),
    findValidByTokenHash: vi.fn(),
    revokeById: vi.fn(),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  }

  return { userRepository, passwordHasher, refreshTokenRepository }
}

describe('ChangeOwnPasswordUseCase', () => {
  it('atualiza o hash da senha do usuário autenticado e revoga os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new ChangeOwnPasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.refreshTokenRepository,
    )

    await useCase.execute({ userId: 'user-1', password: 'nova-senha-123' })

    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('nova-senha-123')
    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', { senhaHash: 'hash-novo' })
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1')
  })
})
