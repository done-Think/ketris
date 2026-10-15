import { describe, expect, it, vi } from 'vitest'

import type { PlatformTenant } from '../../../domain/platform-tenant.entity'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { UpdateTenantAccountUseCase } from '../../../application/use-cases/update-tenant-account.use-case'

const now = new Date('2026-10-15T12:00:00.000Z')

const activeTenant: PlatformTenant = {
  id: 'tenant-1',
  nome: 'Imobiliária A',
  slug: 'imobiliaria-a',
  accountType: 'AGENCY',
  status: 'ACTIVE',
  canceledAt: null,
  createdAt: new Date('2026-01-10T00:00:00.000Z'),
}

function createRepository(tenant: PlatformTenant | null): PlatformTenantRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn().mockResolvedValue(tenant),
    updateAccount: vi.fn().mockImplementation(async (_id, account) => ({ ...tenant, ...account })),
  }
}

describe('UpdateTenantAccountUseCase', () => {
  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const useCase = new UpdateTenantAccountUseCase(createRepository(null), () => now)

    await expect(
      useCase.execute({ tenantId: 'missing', accountType: 'BROKER', status: 'ACTIVE' }),
    ).rejects.toMatchObject({ code: 'TENANT_NOT_FOUND' })
  })

  it('salva tipo de conta e situação sem data de cancelamento enquanto ativo', async () => {
    const repository = createRepository(activeTenant)
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    await useCase.execute({ tenantId: 'tenant-1', accountType: 'BROKER', status: 'ACTIVE' })

    expect(repository.updateAccount).toHaveBeenCalledWith('tenant-1', {
      accountType: 'BROKER',
      status: 'ACTIVE',
      canceledAt: null,
    })
  })

  it('registra a data de cancelamento ao cancelar', async () => {
    const useCase = new UpdateTenantAccountUseCase(createRepository(activeTenant), () => now)

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'AGENCY',
      status: 'CANCELED',
    })

    expect(result.canceledAt).toEqual(now)
  })

  it('mantém a data original ao editar um tenant que já estava cancelado', async () => {
    const canceledAt = new Date('2026-09-03T10:00:00.000Z')
    const repository = createRepository({ ...activeTenant, status: 'CANCELED', canceledAt })
    const useCase = new UpdateTenantAccountUseCase(repository, () => now)

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      accountType: 'INDIVIDUAL',
      status: 'CANCELED',
    })

    expect(result.canceledAt).toEqual(canceledAt)
  })

  it('limpa a data de cancelamento ao reativar', async () => {
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
    })

    expect(result.canceledAt).toBeNull()
  })
})
