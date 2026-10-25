import { describe, expect, it, vi } from 'vitest'

import { CannotDeactivateSelfError, UserNotFoundError } from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { DeactivateUserUseCase } from '../../../application/use-cases/deactivate-user.use-case'

const agent: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  nome: 'Agente',
  email: 'agent@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: { findById?: UserRepository['findById'] }) {
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: overrides?.findById ?? vi.fn().mockResolvedValue(agent),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn().mockResolvedValue({ ...agent, ativo: false }),
    approveMembership: vi.fn(),
  }

  return { userRepository }
}

describe('DeactivateUserUseCase', () => {
  it('desativa o usuário e revoga todos os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorId: 'admin-1',
      actorTenantId: 'tenant-1',
      actorPapel: 'OWNER',
      userId: agent.id,
    })

    expect(result.ativo).toBe(false)
    expect(deps.userRepository.deactivate).toHaveBeenCalledWith(agent.id, 'tenant-1', {
      kind: 'USER',
      id: 'admin-1',
    })
  })

  it('lança ForbiddenError quando o ator não é OWNER', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository)

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
    const useCase = new DeactivateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'OWNER',
        userId: 'admin-1',
      }),
    ).rejects.toThrow(CannotDeactivateSelfError)
    expect(deps.userRepository.deactivate).not.toHaveBeenCalled()
  })

  it('lança UserNotFoundError quando o alvo não existe, é de outro tenant', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeactivateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'OWNER',
        userId: 'inexistente',
      }),
    ).rejects.toThrow(UserNotFoundError)
  })
})
