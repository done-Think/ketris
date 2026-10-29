import { describe, expect, it, vi } from 'vitest'

import { EmailConfirmationRequiredError, UserNotFoundError } from '../../../domain/errors'
import type { User } from '../../../domain/user.entity'
import type { UserRepository } from '../../../application/ports/user-repository.port'
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case'

const owner: User = {
  id: 'owner-1',
  tenantId: 'tenant-1',
  name: 'Proprietário',
  email: 'owner@ketris.dev',
  passwordHash: 'hash-fake',
  role: 'OWNER',
  active: true,
  membershipApprovedAt: new Date(),
}

function createDeps(overrides?: {
  findById?: UserRepository['findById']
  findByEmail?: UserRepository['findByEmail']
  update?: UserRepository['update']
}) {
  const userRepository: UserRepository = {
    findManyByEmail: vi.fn(),

    findById: overrides?.findById ?? vi.fn().mockResolvedValue(owner),
    findByEmail: overrides?.findByEmail ?? vi.fn().mockResolvedValue(null),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: overrides?.update ?? vi.fn().mockResolvedValue({ ...owner, name: 'Atualizado' }),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }

  return { userRepository }
}

describe('UpdateUserUseCase', () => {
  it('atualiza nome/email/papel quando o ator é OWNER e o alvo existe no tenant', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'admin-1',
      actorRole: 'OWNER',
      userId: owner.id,
      name: 'Atualizado',
      phone: '(35) 98888-7777',
      creci: '12345',
    })

    expect(result.name).toBe('Atualizado')
    expect(deps.userRepository.update).toHaveBeenCalledWith(owner.id, {
      auditActor: { kind: 'USER', id: 'admin-1' },
      name: 'Atualizado',
      tenantId: 'tenant-1',
      phone: '(35) 98888-7777',
      creci: '12345',
      avatarUrl: undefined,
      role: undefined,
    })
  })

  it('permite que um OWNER atualize o próprio perfil sem alterar o papel', async () => {
    const admin: User = { ...owner, id: 'admin-1', role: 'OWNER' }
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue(admin),
      update: vi.fn().mockResolvedValue({ ...admin, name: 'Admin atualizado' }),
    })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorId: admin.id,
        actorTenantId: admin.tenantId,
        actorRole: admin.role,
        userId: admin.id,
        name: 'Admin atualizado',
        avatarUrl: `/api/auth/media/avatars/${admin.tenantId}/${admin.id}/avatar.webp`,
      }),
    ).resolves.toMatchObject({ name: 'Admin atualizado' })

    expect(deps.userRepository.update).toHaveBeenCalledWith(admin.id, {
      auditActor: { kind: 'USER', id: 'admin-1' },
      name: 'Admin atualizado',
      tenantId: 'tenant-1',
      phone: undefined,
      creci: undefined,
      avatarUrl: `/api/auth/media/avatars/${admin.tenantId}/${admin.id}/avatar.webp`,
      role: undefined,
    })
  })

  it('lança ForbiddenError quando o ator não é OWNER', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorRole: 'AGENT',
        userId: owner.id,
        name: 'X',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('lança UserNotFoundError quando o alvo não existe, é de outro tenant', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
        actorRole: 'OWNER',
        userId: 'x',
        name: 'X',
      }),
    ).rejects.toThrow(UserNotFoundError)
  })

  it('exige confirmação antes de alterar e-mail mesmo para gestão', async () => {
    const deps = createDeps({
      findByEmail: vi.fn().mockResolvedValue({ ...owner, id: 'outro-id' }),
    })
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
        actorRole: 'OWNER',
        userId: owner.id,
        email: 'em-uso@ketris.dev',
      }),
    ).rejects.toThrow(EmailConfirmationRequiredError)
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })

  it('não checa duplicidade de e-mail quando o e-mail não muda', async () => {
    const deps = createDeps()
    const useCase = new UpdateUserUseCase(deps.userRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'admin-1',
      actorRole: 'OWNER',
      userId: owner.id,
      email: owner.email,
    })

    expect(deps.userRepository.findByEmail).not.toHaveBeenCalled()
  })
  it('permite atualizar telefone/CRECI próprios de um corretor sem mudar papel ou e-mail', async () => {
    const agent: User = { ...owner, id: 'agent-1', role: 'AGENT' }
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(agent) })
    await new UpdateUserUseCase(deps.userRepository).execute({
      actorId: agent.id,
      actorTenantId: agent.tenantId,
      actorRole: agent.role,
      userId: agent.id,
      phone: '(35) 98888-7777',
      creci: '12345',
    })
    expect(deps.userRepository.update).toHaveBeenCalledWith(
      agent.id,
      expect.objectContaining({
        tenantId: agent.tenantId,
        phone: '(35) 98888-7777',
        creci: '12345',
      }),
    )
    expect(deps.userRepository.update).not.toHaveBeenCalledWith(
      agent.id,
      expect.objectContaining({ email: expect.anything() }),
    )
  })

  it('rejeita alteração direta do próprio e-mail com conflito sem gravar', async () => {
    const deps = createDeps()
    await expect(
      new UpdateUserUseCase(deps.userRepository).execute({
        actorId: owner.id,
        actorTenantId: owner.tenantId,
        actorRole: owner.role,
        userId: owner.id,
        email: 'new@example.com',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_CONFIRMATION_REQUIRED', status: 409 })
    expect(deps.userRepository.update).not.toHaveBeenCalled()
  })
})
