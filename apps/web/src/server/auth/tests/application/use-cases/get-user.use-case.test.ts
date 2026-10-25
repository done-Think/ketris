import { describe, expect, it, vi } from 'vitest'

import { UserNotFoundError } from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { GetUserUseCase } from '../../../application/use-cases/get-user.use-case'

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

function createDeps(findById?: UserRepository['findById']) {
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: findById ?? vi.fn().mockResolvedValue(owner),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }

  return { userRepository }
}

describe('GetUserUseCase', () => {
  it('permite consultar o próprio perfil sem acesso de gestão', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ ...owner, papel: 'AGENT' }))
    const result = await new GetUserUseCase(deps.userRepository).execute({
      actorId: owner.id,
      actorPapel: 'AGENT',
      actorTenantId: owner.tenantId,
      userId: owner.id,
    })
    expect(result.id).toBe(owner.id)
  })

  it('mantém isolamento de tenant na leitura do próprio perfil', async () => {
    const deps = createDeps()
    await expect(
      new GetUserUseCase(deps.userRepository).execute({
        actorId: owner.id,
        actorPapel: 'AGENT',
        actorTenantId: 'other',
        userId: owner.id,
      }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('retorna o usuário quando ele existe no tenant do ator', async () => {
    const deps = createDeps()
    const useCase = new GetUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'OWNER',
      userId: owner.id,
    })

    expect(result.id).toBe(owner.id)
    expect(result).not.toHaveProperty('senhaHash')
  })

  it('lança ForbiddenError quando o ator não é o dono da imobiliária', async () => {
    const deps = createDeps()
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', userId: owner.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('lança UserNotFoundError quando o usuário não existe', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER', userId: 'inexistente' }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('lança UserNotFoundError quando o usuário é de outro tenant', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ ...owner, tenantId: 'tenant-2' }))
    const useCase = new GetUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER', userId: owner.id }),
    ).rejects.toThrow(UserNotFoundError)
  })
})
