import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError, UserNotFoundError } from '../../domain/errors'
import type { User } from '../../domain/user.entity'
import type { UserRepository } from '../ports/user-repository.port'
import { UpdateUserUseCase } from './update-user.use-case'

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  nome: 'Proprietário',
  email: 'owner@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
}

function createDeps(overrides?: {
  findById?: UserRepository['findById']
  findByEmailAndTenant?: UserRepository['findByEmailAndTenant']
  update?: UserRepository['update']
}) {
  const userRepository: UserRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(owner),
    findByEmail: vi.fn(),
    findByEmailAndTenant: overrides?.findByEmailAndTenant ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: overrides?.update ?? vi.fn().mockResolvedValue({ ...owner, nome: 'Atualizado' }),
    deactivate: vi.fn(),
  }

  return { userRepository }
}

describe('UpdateUserUseCase', () => {
  it('atualiza nome/email/papel quando o ator é ADMIN e o alvo existe no tenant', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: owner.id,
      nome: 'Atualizado',
    })

    expect(result.nome).toBe('Atualizado')
    expect(deps.userRepository.update).toHaveBeenCalledWith(owner.id, {
      nome: 'Atualizado',
      email: undefined,
      papel: undefined,
    })
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        userId: owner.id,
        nome: 'X',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('lança UserNotFoundError quando o alvo não existe, é de outro tenant, ou é ADMIN', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN', userId: 'x', nome: 'X' }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('lança EmailAlreadyInUseError quando o novo e-mail já pertence a outro usuário do tenant', async () => {
    const deps = createDeps({
      findByEmailAndTenant: vi.fn().mockResolvedValue({ ...owner, id: 'outro-id' }),
    })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        userId: owner.id,
        email: 'em-uso@ketris.dev',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError)
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('não checa duplicidade de e-mail quando o e-mail não muda', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: owner.id,
      email: owner.email,
    })

    expect(deps.userRepository.findByEmailAndTenant).not.toHaveBeenCalled()
  })
})
