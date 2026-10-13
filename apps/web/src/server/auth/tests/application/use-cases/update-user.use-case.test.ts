import { describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError, UserNotFoundError } from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case'

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  nome: 'Proprietário',
  email: 'owner@ketris.dev',
  senhaHash: 'hash-fake',
  papel: 'OWNER',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

function createDeps(overrides?: {
  findById?: UserRepository['findById']
  findByEmail?: UserRepository['findByEmail']
  update?: UserRepository['update']
}) {
  const userRepository: UserRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(owner),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: overrides?.update ?? vi.fn().mockResolvedValue({ ...owner, nome: 'Atualizado' }),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }

  return { userRepository }
}

describe('UpdateUserUseCase', () => {
  it('atualiza nome/email/papel quando o ator é ADMIN e o alvo existe no tenant', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'admin-1',
      actorPapel: 'ADMIN',
      userId: owner.id,
      nome: 'Atualizado',
    })

    expect(result.nome).toBe('Atualizado')
    expect(deps.userRepository.update).toHaveBeenCalledWith(owner.id, {
      nome: 'Atualizado',
      email: undefined,
      avatarUrl: undefined,
      papel: undefined,
    })
  })

  it('permite que um ADMIN atualize o próprio perfil sem alterar o papel', async () => {
    const admin: User = { ...owner, id: 'admin-1', papel: 'ADMIN' }
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue(admin),
      update: vi.fn().mockResolvedValue({ ...admin, nome: 'Admin atualizado' }),
    })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorId: admin.id,
        actorTenantId: admin.tenantId,
        actorPapel: admin.papel,
        userId: admin.id,
        nome: 'Admin atualizado',
        avatarUrl: 'https://cdn.ketris.dev/avatar.webp',
      }),
    ).resolves.toMatchObject({ nome: 'Admin atualizado' })

    expect(deps.userRepository.update).toHaveBeenCalledWith(admin.id, {
      nome: 'Admin atualizado',
      email: undefined,
      avatarUrl: 'https://cdn.ketris.dev/avatar.webp',
      papel: undefined,
    })
  })

  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
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
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
        actorPapel: 'ADMIN',
        userId: 'x',
        nome: 'X',
      }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('lança EmailAlreadyInUseError quando o novo e-mail já pertence a outro usuário (em qualquer tenant)', async () => {
    const deps = createDeps({
      findByEmail: vi.fn().mockResolvedValue({ ...owner, id: 'outro-id' }),
    })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
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
      actorId: 'admin-1',
      actorPapel: 'ADMIN',
      userId: owner.id,
      email: owner.email,
    })

    expect(deps.userRepository.findByEmail).not.toHaveBeenCalled()
  })
})
