import { describe, expect, it, vi } from 'vitest'

import {
  CannotDeactivateSelfError,
  PortfolioTransferRequiredError,
  UserNotFoundError,
} from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'
import type { UserPortfolioReader } from '../../../application/ports/user-portfolio-reader.port'
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

function createDeps(overrides?: { findById?: UserRepository['findById'] }, hasPortfolio = false) {
  const portfolioReader: UserPortfolioReader = {
    hasPortfolio: vi.fn().mockResolvedValue(hasPortfolio),
  }
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

  return { userRepository, portfolioReader }
}

describe('DeactivateUserUseCase', () => {
  it('desativa o usuário e revoga todos os refresh tokens dele', async () => {
    const deps = createDeps()
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.portfolioReader)

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
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.portfolioReader)

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
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.portfolioReader)

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
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.portfolioReader)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'OWNER',
        userId: 'inexistente',
      }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('exige a transferência da carteira antes de desativar quem ainda tem imóveis, leads ou eventos', async () => {
    const deps = createDeps(undefined, true)
    const useCase = new DeactivateUserUseCase(deps.userRepository, deps.portfolioReader)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 'tenant-1',
        actorPapel: 'OWNER',
        userId: agent.id,
      }),
    ).rejects.toBeInstanceOf(PortfolioTransferRequiredError)
    expect(deps.portfolioReader.hasPortfolio).toHaveBeenCalledWith('tenant-1', agent.id)
    expect(deps.userRepository.deactivate).not.toHaveBeenCalled()
  })
})
