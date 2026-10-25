import { describe, expect, it, vi } from 'vitest'

import { InvalidCurrentPasswordError, UserNotFoundError } from '../../../domain/errors'

import type { PasswordHasher } from '../../../application/ports/password-hasher.port'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ChangeOwnPasswordUseCase } from '../../../application/use-cases/change-own-password.use-case'

function createDeps() {
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: vi
      .fn()
      .mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1', senhaHash: 'hash-atual' }),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const passwordHasher: PasswordHasher = {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hash-novo'),
  }

  return { userRepository, passwordHasher }
}

describe('ChangeOwnPasswordUseCase', () => {
  it('atualiza o hash da senha do usuário autenticado e revoga os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new ChangeOwnPasswordUseCase(deps.userRepository, deps.passwordHasher)

    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'senha-atual',
      password: 'nova-senha-123',
    })

    expect(deps.passwordHasher.compare).toHaveBeenCalledWith('senha-atual', 'hash-atual')
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('nova-senha-123')
    expect(deps.userRepository.update).toHaveBeenCalledWith('user-1', {
      senhaHash: 'hash-novo',
      tenantId: 'tenant-1',
      auditActor: { kind: 'USER', id: 'user-1' },
    })
  })

  it('rejeita a troca quando a senha atual está incorreta, sem alterar nada', async () => {
    const deps = createDeps()
    vi.mocked(deps.passwordHasher.compare).mockResolvedValue(false)
    const useCase = new ChangeOwnPasswordUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'errada', password: 'nova-senha-123' }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError)

    expect(deps.passwordHasher.hash).not.toHaveBeenCalled()
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('rejeita a troca quando o usuário não existe', async () => {
    const deps = createDeps()
    vi.mocked(deps.userRepository.findById).mockResolvedValue(null)
    const useCase = new ChangeOwnPasswordUseCase(deps.userRepository, deps.passwordHasher)

    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'x', password: 'nova-senha-123' }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })
})
