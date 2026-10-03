import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ApproveUserMembershipUseCase } from '../../../application/use-cases/approve-user-membership.use-case'

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'agent-1',
    tenantId: 'tenant-1',
    nome: 'Corretor Pendente',
    email: 'corretor@ketris.dev',
    senhaHash: 'hash',
    papel: 'AGENT',
    ativo: true,
    vinculoAprovadoEm: null,
    ...overrides,
  }
}

describe('ApproveUserMembershipUseCase', () => {
  it('lança ForbiddenError quando o ator não é ADMIN', async () => {
    const userRepository = {} as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'OWNER', userId: 'agent-1' }),
    ).rejects.toThrow('Apenas administradores podem aprovar vínculos.')
  })

  it('lança UserNotFoundError quando o alvo não existe', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', userId: 'inexistente' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança UserNotFoundError (opaco) quando o alvo é de outro tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ tenantId: 'tenant-2' })),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', userId: 'agent-1' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança UserNotFoundError (opaco) quando o alvo é um ADMIN', async () => {
    const userRepository = {
      findById: vi
        .fn()
        .mockResolvedValue(buildUser({ papel: 'ADMIN', vinculoAprovadoEm: new Date() })),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({ actorTenantId: 't1', actorPapel: 'ADMIN', userId: 'agent-1' }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('aprova o vínculo pendente', async () => {
    const approved = buildUser({ vinculoAprovadoEm: new Date() })
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
      approveMembership: vi.fn().mockResolvedValue(approved),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: 'agent-1',
    })

    expect(userRepository.approveMembership).toHaveBeenCalledWith('agent-1')
    expect(result.vinculoAprovadoEm).not.toBeNull()
  })

  it('é idempotente — aprovar de novo não chama o repositório nem lança erro', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ vinculoAprovadoEm: new Date() })),
      approveMembership: vi.fn(),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      userId: 'agent-1',
    })

    expect(userRepository.approveMembership).not.toHaveBeenCalled()
    expect(result.vinculoAprovadoEm).not.toBeNull()
  })
})
