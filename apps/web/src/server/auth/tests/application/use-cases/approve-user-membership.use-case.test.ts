import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { ApproveUserMembershipUseCase } from '../../../application/use-cases/approve-user-membership.use-case'

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'agent-1',
    tenantId: 'tenant-1',
    name: 'Corretor Pendente',
    email: 'corretor@ketris.dev',
    passwordHash: 'hash',
    role: 'AGENT',
    active: true,
    membershipApprovedAt: null,
    ...overrides,
  }
}

describe('ApproveUserMembershipUseCase', () => {
  it('lança ForbiddenError quando o ator não é o dono da imobiliária', async () => {
    const userRepository = {} as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 't1',
        actorRole: 'AGENT',
        userId: 'agent-1',
      }),
    ).rejects.toThrow('Apenas a gestão da imobiliária pode aprovar vínculos.')
  })

  it('lança UserNotFoundError quando o alvo não existe', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 't1',
        actorRole: 'OWNER',
        userId: 'inexistente',
      }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('lança UserNotFoundError (opaco) quando o alvo é de outro tenant', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ tenantId: 'tenant-2' })),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    await expect(
      useCase.execute({
        actorId: 'admin-1',
        actorTenantId: 't1',
        actorRole: 'OWNER',
        userId: 'agent-1',
      }),
    ).rejects.toThrow('Usuário não encontrado.')
  })

  it('aprova o vínculo pendente', async () => {
    const approved = buildUser({ membershipApprovedAt: new Date() })
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser()),
      approveMembership: vi.fn().mockResolvedValue(approved),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    const result = await useCase.execute({
      actorId: 'admin-1',
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      userId: 'agent-1',
    })

    expect(userRepository.approveMembership).toHaveBeenCalledWith('agent-1', 'tenant-1', {
      kind: 'USER',
      id: 'admin-1',
    })
    expect(result.membershipApprovedAt).not.toBeNull()
  })

  it('é idempotente — aprovar de novo não chama o repositório nem lança erro', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(buildUser({ membershipApprovedAt: new Date() })),
      approveMembership: vi.fn(),
    } as unknown as UserRepository
    const useCase = new ApproveUserMembershipUseCase(userRepository)

    const result = await useCase.execute({
      actorId: 'admin-1',
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      userId: 'agent-1',
    })

    expect(userRepository.approveMembership).not.toHaveBeenCalled()
    expect(result.membershipApprovedAt).not.toBeNull()
  })
})
