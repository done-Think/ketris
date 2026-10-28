import { describe, expect, it, vi } from 'vitest'

import type { PlatformTenant } from '../../../types/platform-tenant'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { UpdateTenantAccountUseCase } from '../../../application/use-cases/update-tenant-account.use-case'

const now = new Date('2026-10-15T12:00:00.000Z')

const activeTenant: PlatformTenant = {
  id: 'tenant-1',
  name: 'Imobiliária A',
  slug: 'imobiliaria-a',
  accountType: 'AGENCY',
  status: 'ACTIVE',
  canceledAt: null,
  createdAt: new Date('2026-01-10T00:00:00.000Z'),
}

function createRepository(tenant: PlatformTenant | null): PlatformTenantRepository {
  return {
    findMany: vi.fn(),
    findPage: vi.fn(),
    countByStatus: vi.fn(),
    findById: vi.fn().mockResolvedValue(tenant),
    updateAccount: vi
      .fn()
      .mockImplementation(async (_id, _expected, account) => ({ ...tenant, ...account })),
    findStatusChanges: vi.fn(),
    countUsage: vi.fn(),
  }
}

describe('UpdateTenantAccountUseCase', () => {
  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const repository = createRepository(null)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await expect(
      useCase.execute({
        tenantId: 'missing',
        accountType: 'BROKER',
        status: 'ACTIVE',
        actorId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: 'TENANT_NOT_FOUND' })
    expect(repository.updateAccount).not.toHaveBeenCalled()
  })

  it('muda só o tipo de conta sem registrar troca de situação', async () => {
    const repository = createRepository(activeTenant)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'BROKER',
      status: 'ACTIVE',
      actorId: 'admin-1',
    })

    expect(repository.updateAccount).toHaveBeenCalledWith(
      'tenant-1',
      { accountType: 'AGENCY', status: 'ACTIVE' },
      { accountType: 'BROKER', status: 'ACTIVE', canceledAt: null },
      null,
    )
  })

  it('ao cancelar, registra a data e a troca de situação com quem fez', async () => {
    const repository = createRepository(activeTenant)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'AGENCY',
      status: 'CANCELED',
      actorId: 'admin-1',
    })

    expect(result.canceledAt).toEqual(now)
    expect(repository.updateAccount).toHaveBeenCalledWith(
      'tenant-1',
      { accountType: 'AGENCY', status: 'ACTIVE' },
      { accountType: 'AGENCY', status: 'CANCELED', canceledAt: now },
      { fromStatus: 'ACTIVE', toStatus: 'CANCELED', changedAt: now, changedById: 'admin-1' },
    )
  })

  it('mantém a data original e não registra troca ao editar um tenant já cancelado', async () => {
    const canceledAt = new Date('2026-09-03T10:00:00.000Z')
    const repository = createRepository({ ...activeTenant, status: 'CANCELED', canceledAt })
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'INDIVIDUAL',
      status: 'CANCELED',
      actorId: 'admin-1',
    })

    expect(result.canceledAt).toEqual(canceledAt)
    expect(repository.updateAccount).toHaveBeenCalledWith(
      'tenant-1',
      { accountType: 'AGENCY', status: 'CANCELED' },
      { accountType: 'INDIVIDUAL', status: 'CANCELED', canceledAt },
      null,
    )
  })

  it('ao reativar, limpa a data exibida mas registra a reativação no histórico', async () => {
    const repository = createRepository({
      ...activeTenant,
      status: 'CANCELED',
      canceledAt: new Date('2026-09-03T10:00:00.000Z'),
    })
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'AGENCY',
      status: 'ACTIVE',
      actorId: 'admin-2',
    })

    expect(result.canceledAt).toBeNull()
    expect(repository.updateAccount).toHaveBeenCalledWith(
      'tenant-1',
      { accountType: 'AGENCY', status: 'CANCELED' },
      { accountType: 'AGENCY', status: 'ACTIVE', canceledAt: null },
      { fromStatus: 'CANCELED', toStatus: 'ACTIVE', changedAt: now, changedById: 'admin-2' },
    )
  })

  it('registra trocas que não são cancelamento, como suspender', async () => {
    const repository = createRepository(activeTenant)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'AGENCY',
      status: 'SUSPENDED',
      actorId: null,
    })

    expect(repository.updateAccount).toHaveBeenCalledWith(
      'tenant-1',
      { accountType: 'AGENCY', status: 'ACTIVE' },
      { accountType: 'AGENCY', status: 'SUSPENDED', canceledAt: null },
      { fromStatus: 'ACTIVE', toStatus: 'SUSPENDED', changedAt: now, changedById: null },
    )
  })

  it('lança conflito quando outra alteração mudou a situação antes de salvar', async () => {
    const repository = createRepository(activeTenant)
    vi.mocked(repository.updateAccount).mockResolvedValue(null)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        accountType: 'AGENCY',
        status: 'CANCELED',
        actorId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: 'TENANT_ACCOUNT_CHANGED_CONCURRENTLY', status: 409 })
  })

  it('lança TenantNotFoundError quando o tenant foi apagado antes de salvar', async () => {
    const repository = createRepository(activeTenant)
    vi.mocked(repository.findById).mockResolvedValueOnce(activeTenant).mockResolvedValueOnce(null)
    vi.mocked(repository.updateAccount).mockResolvedValue(null)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        accountType: 'BROKER',
        status: 'ACTIVE',
        actorId: 'admin-1',
      }),
    ).rejects.toMatchObject({ code: 'TENANT_NOT_FOUND', status: 404 })
  })
})
