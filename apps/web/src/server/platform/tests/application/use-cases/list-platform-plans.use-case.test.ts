import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { ListPlatformPlansUseCase } from '../../../application/use-cases/list-platform-plans.use-case'

const updatedAt = new Date('2026-10-15T00:00:00.000Z')

describe('ListPlatformPlansUseCase', () => {
  it('conta só as contas ativas e cobráveis de cada plano', async () => {
    const tenant = (accountType: string, status: string, slug = `t-${Math.random()}`) => ({
      id: slug,
      name: slug,
      slug,
      accountType,
      status,
      canceledAt: null,
      createdAt: updatedAt,
    })
    const tenantRepository = {
      findMany: vi
        .fn()
        .mockResolvedValue([
          tenant('BROKER', 'ACTIVE'),
          tenant('BROKER', 'ACTIVE'),
          tenant('BROKER', 'TRIAL'),
          tenant('AGENCY', 'ACTIVE'),
          tenant('AGENCY', 'ACTIVE', 'locatarios'),
          tenant('INDIVIDUAL', 'CANCELED'),
        ]),
    } as unknown as PlatformTenantRepository
    const planRepository: PlatformPlanRepository = {
      findAll: vi.fn().mockResolvedValue(
        (['INDIVIDUAL', 'BROKER', 'AGENCY'] as const).map((accountType) => ({
          accountType,
          monthlyPrice: 1,
          includedUnits: 10,
          extraUnitPrice: 1,
          updatedAt,
        })),
      ),
      update: vi.fn(),
    }

    const plans = await new ListPlatformPlansUseCase(planRepository, tenantRepository).execute()

    expect(plans.map((plan) => [plan.accountType, plan.activeAccounts])).toEqual([
      ['INDIVIDUAL', 0],
      ['BROKER', 2],
      ['AGENCY', 1],
    ])
  })
})
