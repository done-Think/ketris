import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { ListTenantsUseCase } from '../../../application/use-cases/list-tenants.use-case'
import type { PlatformPlan } from '../../../types/platform-plan'
import type { PlatformTenant } from '../../../types/platform-tenant'

const createdAt = new Date('2026-09-01T00:00:00.000Z')
const tenants: PlatformTenant[] = [
  {
    id: 't1',
    name: 'Imobiliária A',
    slug: 'imobiliaria-a',
    accountType: 'AGENCY',
    status: 'ACTIVE',
    canceledAt: null,
    createdAt,
  },
  {
    id: 't2',
    name: 'Corretor B',
    slug: 'corretor-b',
    accountType: 'BROKER',
    status: 'TRIAL',
    canceledAt: null,
    createdAt,
  },
  {
    id: 't3',
    name: 'Locatários',
    slug: 'locatarios',
    accountType: 'AGENCY',
    status: 'ACTIVE',
    canceledAt: null,
    createdAt,
  },
]
const plans: PlatformPlan[] = [
  {
    accountType: 'INDIVIDUAL',
    monthlyPrice: 49.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    createdAt: createdAt,
    updatedAt: createdAt,
    updatedBy: null,
  },
  {
    accountType: 'BROKER',
    monthlyPrice: 99.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    createdAt: createdAt,
    updatedAt: createdAt,
    updatedBy: null,
  },
  {
    accountType: 'AGENCY',
    monthlyPrice: 199.99,
    includedUnits: 10,
    extraUnitPrice: 19.99,
    createdAt: createdAt,
    updatedAt: createdAt,
    updatedBy: null,
  },
]

const statusCounts = { TRIAL: 1, ACTIVE: 2, SUSPENDED: 0, CANCELED: 0 }

function createRepositories() {
  const tenantRepository: PlatformTenantRepository = {
    findMany: vi.fn(),
    findPage: vi.fn().mockResolvedValue({ items: tenants, totalCount: 23 }),
    countByStatus: vi.fn().mockResolvedValue(statusCounts),
    findById: vi.fn(),
    updateAccount: vi.fn(),
    findStatusChanges: vi.fn().mockResolvedValue([]),
    countUsage: vi.fn().mockResolvedValue(
      new Map([
        ['t1', { properties: 40, brokers: 12 }],
        ['t2', { properties: 13, brokers: 1 }],
      ]),
    ),
  }
  const planRepository: PlatformPlanRepository = {
    findAll: vi.fn().mockResolvedValue(plans),
    update: vi.fn(),
  }

  return { tenantRepository, planRepository }
}

describe('ListTenantsUseCase', () => {
  it('calcula a mensalidade de cada tenant da página pelo plano do tipo de conta e pelo uso', async () => {
    const { tenantRepository, planRepository } = createRepositories()
    const query = { q: 'imob', accountType: 'AGENCY' as const, page: 2, pageSize: 3 }

    const result = await new ListTenantsUseCase(tenantRepository, planRepository).execute(query)

    expect(result.items.map((tenant) => [tenant.id, tenant.monthlyCharge?.total ?? null])).toEqual([
      ['t1', 239.97],
      ['t2', 129.96],
      ['t3', null],
    ])
    expect(result).toMatchObject({ totalCount: 23, page: 2, pageSize: 3, statusCounts })
    expect(tenantRepository.findPage).toHaveBeenCalledWith(query)
    expect(tenantRepository.countByStatus).toHaveBeenCalledWith({
      q: 'imob',
      accountType: 'AGENCY',
    })
  })

  it('conta o uso só dos tenants da página', async () => {
    const { tenantRepository, planRepository } = createRepositories()

    await new ListTenantsUseCase(tenantRepository, planRepository).execute({
      page: 1,
      pageSize: 20,
    })

    expect(tenantRepository.countUsage).toHaveBeenCalledWith(['t1', 't2', 't3'])
  })
})
