import { describe, expect, it } from 'vitest'

import { calculateChurnRate, summarizeBilling } from '../../domain/platform-billing'
import type { MonthlyCharge } from '../../domain/platform-plan'
import type { ChargedPlatformTenant } from '../../domain/platform-tenant.entity'
import type { TenantAccountType, TenantStatus } from '../../domain/tenant-account'

const referenceDate = new Date(2026, 9, 15, 12, 0)

function charge(total: number): MonthlyCharge {
  return {
    usageUnit: 'PROPERTIES',
    usage: 0,
    includedUnits: 10,
    extraUnits: 0,
    basePrice: total,
    extraAmount: 0,
    total,
  }
}

let sequence = 0
function tenant(
  accountType: TenantAccountType,
  status: TenantStatus,
  total: number | null,
  dates: { createdAt?: Date; canceledAt?: Date | null } = {},
): ChargedPlatformTenant {
  sequence += 1
  return {
    id: `t${sequence}`,
    nome: `Tenant ${sequence}`,
    slug: `tenant-${sequence}`,
    accountType,
    status,
    canceledAt: dates.canceledAt ?? null,
    createdAt: dates.createdAt ?? new Date(2026, 0, 10),
    monthlyCharge: total === null ? null : charge(total),
  }
}

describe('summarizeBilling', () => {
  it('soma no MRR só as contas ativas, em centavos, e separa por tipo de conta', () => {
    const summary = summarizeBilling(
      [
        tenant('AGENCY', 'ACTIVE', 199.99),
        tenant('AGENCY', 'ACTIVE', 259.96),
        tenant('BROKER', 'ACTIVE', 0.1),
        tenant('BROKER', 'ACTIVE', 0.2),
        tenant('BROKER', 'TRIAL', 99.99),
        tenant('INDIVIDUAL', 'SUSPENDED', 49.99),
        tenant('AGENCY', 'ACTIVE', null),
      ],
      referenceDate,
    )

    expect(summary.mrr).toBe(460.25)
    expect(summary).toMatchObject({ payingAccounts: 4, trialAccounts: 1, suspendedAccounts: 1 })
    expect(summary.byAccountType).toEqual([
      { accountType: 'INDIVIDUAL', activeAccounts: 0, mrr: 0 },
      { accountType: 'BROKER', activeAccounts: 2, mrr: 0.3 },
      { accountType: 'AGENCY', activeAccounts: 2, mrr: 459.95 },
    ])
  })

  it('calcula o churn sobre a base do dia 1 do mês', () => {
    const summary = summarizeBilling(
      [
        tenant('AGENCY', 'ACTIVE', 1),
        tenant('BROKER', 'SUSPENDED', 1),
        tenant('BROKER', 'TRIAL', 1),
        // In the base on October 1st and canceled in October: the only churn.
        tenant('INDIVIDUAL', 'CANCELED', 1, { canceledAt: new Date(2026, 9, 5) }),
        // Canceled before October: not in the base.
        tenant('INDIVIDUAL', 'CANCELED', 1, { canceledAt: new Date(2026, 8, 20) }),
        // Created and canceled in October: not in the base.
        tenant('BROKER', 'CANCELED', 1, {
          createdAt: new Date(2026, 9, 2),
          canceledAt: new Date(2026, 9, 10),
        }),
        // The renters' system tenant is never counted.
        tenant('AGENCY', 'CANCELED', null, { canceledAt: new Date(2026, 9, 3) }),
      ],
      referenceDate,
    )

    expect(summary.canceledThisMonth).toBe(1)
    expect(summary.churnRate).toBe(1 / 4)
  })

  it('não mede churn quando não havia base no início do mês', () => {
    const summary = summarizeBilling(
      [
        tenant('AGENCY', 'CANCELED', 1, {
          createdAt: new Date(2026, 9, 2),
          canceledAt: new Date(2026, 9, 3),
        }),
      ],
      referenceDate,
    )

    expect(summary.churnRate).toBeNull()
  })
})

describe('calculateChurnRate', () => {
  it('divide os cancelamentos pela base e devolve null sem base', () => {
    expect(calculateChurnRate(1, 40)).toBe(0.025)
    expect(calculateChurnRate(0, 0)).toBeNull()
  })
})
