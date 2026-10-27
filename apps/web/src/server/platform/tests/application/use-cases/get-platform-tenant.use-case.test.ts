import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { GetPlatformTenantUseCase } from '../../../application/use-cases/get-platform-tenant.use-case'
import { TenantNotFoundError } from '../../../domain/errors'
import type { PlatformTenant } from '../../../types/platform-tenant'

const createdAt = new Date('2026-09-01T00:00:00.000Z')
const tenant: PlatformTenant = {
  id: 't1',
  nome: 'Imobiliária A',
  slug: 'imobiliaria-a',
  accountType: 'AGENCY',
  status: 'ACTIVE',
  canceledAt: null,
  createdAt,
}

function createRepositories(found: PlatformTenant | null) {
  const tenantRepository: PlatformTenantRepository = {
    findMany: vi.fn(),
    findPage: vi.fn(),
    countByStatus: vi.fn(),
    findById: vi.fn().mockResolvedValue(found),
    updateAccount: vi.fn(),
    findStatusChanges: vi.fn(),
    countUsage: vi.fn().mockResolvedValue(new Map([['t1', { properties: 0, brokers: 12 }]])),
  }
  const planRepository: PlatformPlanRepository = {
    findAll: vi.fn().mockResolvedValue([
      {
        accountType: 'AGENCY',
        monthlyPrice: 199.99,
        includedUnits: 10,
        extraUnitPrice: 19.99,
        updatedAt: createdAt,
      },
    ]),
    update: vi.fn(),
  }

  return { tenantRepository, planRepository }
}

describe('GetPlatformTenantUseCase', () => {
  it('devolve o tenant com a mensalidade calculada só pelo uso dele', async () => {
    const { tenantRepository, planRepository } = createRepositories(tenant)

    const result = await new GetPlatformTenantUseCase(tenantRepository, planRepository).execute(
      't1',
    )

    expect(result.monthlyCharge?.total).toBe(239.97)
    expect(tenantRepository.countUsage).toHaveBeenCalledWith(['t1'])
    expect(tenantRepository.findMany).not.toHaveBeenCalled()
  })

  it('lança TenantNotFoundError quando o tenant não existe', async () => {
    const { tenantRepository, planRepository } = createRepositories(null)

    await expect(
      new GetPlatformTenantUseCase(tenantRepository, planRepository).execute('x'),
    ).rejects.toBeInstanceOf(TenantNotFoundError)
  })
})
