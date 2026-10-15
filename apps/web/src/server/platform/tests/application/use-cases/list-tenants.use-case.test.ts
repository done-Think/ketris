import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { ListTenantsUseCase } from '../../../application/use-cases/list-tenants.use-case'
import type { PlatformPlan } from '../../../domain/platform-plan'
import type { PlatformTenant } from '../../../domain/platform-tenant.entity'

const createdAt = new Date('2026-09-01T00:00:00.000Z')
const tenants: PlatformTenant[] = [
  {
    id: 't1',
    nome: 'Imobiliária A',
    slug: 'imobiliaria-a',
    accountType: 'AGENCY',
    status: 'ACTIVE',
    canceledAt: null,
    createdAt,
  },
  {
    id: 't2',
    nome: 'Corretor B',
    slug: 'corretor-b',
    accountType: 'BROKER',
    status: 'TRIAL',
    canceledAt: null,
    createdAt,
  },
  {
    id: 't3',
    nome: 'Locatários',
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
    updatedAt: createdAt,
  },
  {
    accountType: 'BROKER',
    monthlyPrice: 99.99,
    includedUnits: 10,
    extraUnitPrice: 9.99,
    updatedAt: createdAt,
  },
  {
    accountType: 'AGENCY',
    monthlyPrice: 199.99,
    includedUnits: 10,
    extraUnitPrice: 19.99,
    updatedAt: createdAt,
  },
]

describe('ListTenantsUseCase', () => {
  it('calcula a mensalidade de cada tenant pelo plano do tipo de conta e pelo uso', async () => {
    const tenantRepository: PlatformTenantRepository = {
      findMany: vi.fn().mockResolvedValue(tenants),
      findById: vi.fn(),
      updateAccount: vi.fn(),
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

    const result = await new ListTenantsUseCase(tenantRepository, planRepository).execute()

    expect(result.map((tenant) => [tenant.id, tenant.monthlyCharge?.total ?? null])).toEqual([
      ['t1', 239.97],
      ['t2', 129.96],
      ['t3', null],
    ])
  })
})
