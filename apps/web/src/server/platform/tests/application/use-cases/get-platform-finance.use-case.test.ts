import { describe, expect, it, vi } from 'vitest'

import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { GetPlatformFinanceUseCase } from '../../../application/use-cases/get-platform-finance.use-case'

const createdAt = new Date(2026, 0, 10)
const now = new Date(2026, 9, 15, 12, 0)

describe('GetPlatformFinanceUseCase', () => {
  it('resume a receita e lista as contas cobráveis da maior mensalidade para a menor', async () => {
    const tenantRepository: PlatformTenantRepository = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'b',
          nome: 'Corretor',
          slug: 'corretor',
          accountType: 'BROKER',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt,
        },
        {
          id: 'a',
          nome: 'Imobiliária',
          slug: 'imobiliaria',
          accountType: 'AGENCY',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt,
        },
        {
          id: 'r',
          nome: 'Locatários',
          slug: 'locatarios',
          accountType: 'AGENCY',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt,
        },
      ]),
      findById: vi.fn(),
      updateAccount: vi.fn(),
      findStatusChanges: vi.fn().mockResolvedValue([]),
      countUsage: vi.fn().mockResolvedValue(new Map([['b', { properties: 11, brokers: 1 }]])),
    }
    const planRepository: PlatformPlanRepository = {
      findAll: vi.fn().mockResolvedValue([
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
      ]),
      update: vi.fn(),
    }

    const finance = await new GetPlatformFinanceUseCase(
      tenantRepository,
      planRepository,
      () => now,
    ).execute()

    expect(finance.referenceDate).toBe(now)
    expect(finance.mrr).toBe(309.97)
    expect(finance.payingAccounts).toBe(2)
    expect(finance.accounts.map((account) => [account.id, account.monthlyCharge?.total])).toEqual([
      ['a', 199.99],
      ['b', 109.98],
    ])
  })

  it('mede o churn pelo histórico: reativar não apaga o cancelamento do mês', async () => {
    const tenantRepository: PlatformTenantRepository = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'a',
          nome: 'Imobiliária A',
          slug: 'imobiliaria-a',
          accountType: 'AGENCY',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt,
        },
        {
          id: 'b',
          nome: 'Imobiliária B',
          slug: 'imobiliaria-b',
          accountType: 'AGENCY',
          status: 'ACTIVE',
          canceledAt: null,
          createdAt,
        },
      ]),
      findById: vi.fn(),
      updateAccount: vi.fn(),
      findStatusChanges: vi.fn().mockResolvedValue([
        {
          tenantId: 'a',
          fromStatus: 'ACTIVE',
          toStatus: 'CANCELED',
          changedAt: new Date('2026-10-05T12:00:00.000Z'),
        },
        {
          tenantId: 'a',
          fromStatus: 'CANCELED',
          toStatus: 'ACTIVE',
          changedAt: new Date('2026-10-07T12:00:00.000Z'),
        },
      ]),
      countUsage: vi.fn().mockResolvedValue(new Map()),
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

    const finance = await new GetPlatformFinanceUseCase(
      tenantRepository,
      planRepository,
      () => new Date('2026-10-15T15:00:00.000Z'),
    ).execute()

    expect(finance).toMatchObject({
      mrr: 399.98,
      payingAccounts: 2,
      canceledThisMonth: 1,
      churnBaseAccounts: 2,
      churnRate: 1 / 2,
    })
    // Only the history the month needs: from 00:00 of Oct 1st in São Paulo (03:00 UTC) on.
    expect(tenantRepository.findStatusChanges).toHaveBeenCalledWith(
      new Date('2026-10-01T03:00:00.000Z'),
    )
  })
})
