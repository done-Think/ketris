import { describe, expect, it } from 'vitest'

import { calculateChurnRate, summarizeBilling } from '../../domain/platform-billing'
import type { MonthlyCharge } from '../../domain/platform-plan'
import type { ChargedPlatformTenant } from '../../domain/platform-tenant.entity'
import type { TenantAccountType, TenantStatus } from '../../domain/tenant-account'
import {
  groupStatusChangesByTenant,
  type TenantStatusChange,
} from '../../domain/tenant-status-history'

// Instants are UTC; São Paulo is UTC-3, so October 2026 there runs from 2026-10-01T03:00Z
// (inclusive) to 2026-11-01T03:00Z (exclusive).
const octoberReference = new Date('2026-10-15T15:00:00.000Z')
const septemberReference = new Date('2026-09-15T15:00:00.000Z')
const longAgo = new Date('2026-01-10T12:00:00.000Z')

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

function tenant(
  id: string,
  status: TenantStatus,
  options: { accountType?: TenantAccountType; total?: number | null; createdAt?: string } = {},
): ChargedPlatformTenant {
  const total = options.total === undefined ? 100 : options.total

  return {
    id,
    nome: `Tenant ${id}`,
    slug: `tenant-${id}`,
    accountType: options.accountType ?? 'AGENCY',
    status,
    canceledAt: null,
    createdAt: options.createdAt ? new Date(options.createdAt) : longAgo,
    monthlyCharge: total === null ? null : charge(total),
  }
}

function change(
  tenantId: string,
  fromStatus: TenantStatus,
  toStatus: TenantStatus,
  changedAt: string,
): TenantStatusChange {
  return { tenantId, fromStatus, toStatus, changedAt: new Date(changedAt) }
}

function churn(
  tenants: ChargedPlatformTenant[],
  changes: TenantStatusChange[],
  referenceDate = octoberReference,
) {
  const { canceledThisMonth, churnBaseAccounts, churnRate } = summarizeBilling(
    tenants,
    groupStatusChangesByTenant(changes),
    referenceDate,
  )

  return { canceledThisMonth, churnBaseAccounts, churnRate }
}

describe('summarizeBilling', () => {
  it('soma no MRR só as contas ativas, em centavos, e separa por tipo de conta', () => {
    const summary = summarizeBilling(
      [
        tenant('a', 'ACTIVE', { total: 199.99 }),
        tenant('b', 'ACTIVE', { total: 259.96 }),
        tenant('c', 'ACTIVE', { accountType: 'BROKER', total: 0.1 }),
        tenant('d', 'ACTIVE', { accountType: 'BROKER', total: 0.2 }),
        tenant('e', 'TRIAL', { accountType: 'BROKER', total: 99.99 }),
        tenant('f', 'SUSPENDED', { accountType: 'INDIVIDUAL', total: 49.99 }),
        tenant('renters', 'ACTIVE', { total: null }),
      ],
      new Map(),
      octoberReference,
    )

    expect(summary.mrr).toBe(460.25)
    expect(summary).toMatchObject({ payingAccounts: 4, trialAccounts: 1, suspendedAccounts: 1 })
    expect(summary.byAccountType).toEqual([
      { accountType: 'INDIVIDUAL', activeAccounts: 0, mrr: 0 },
      { accountType: 'BROKER', activeAccounts: 2, mrr: 0.3 },
      { accountType: 'AGENCY', activeAccounts: 2, mrr: 459.95 },
    ])
  })

  describe('base do churn (contas pagantes às 00:00 do dia 1)', () => {
    it('conta só quem estava ACTIVE; teste e suspensas ficam fora da base', () => {
      expect(
        churn(
          [
            tenant('active', 'ACTIVE'),
            tenant('trial', 'TRIAL'),
            tenant('suspended', 'SUSPENDED'),
            tenant('renters', 'ACTIVE', { total: null }),
          ],
          [],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })

    it('reconstrói a situação do dia 1 pelo histórico, não pela situação atual', () => {
      expect(
        churn(
          [
            // Paying on October 1st, suspended since then: still in the base.
            tenant('suspended-later', 'SUSPENDED'),
            // Trial on October 1st, paying since then: not in the base.
            tenant('activated-later', 'ACTIVE'),
          ],
          [
            change('suspended-later', 'ACTIVE', 'SUSPENDED', '2026-10-05T12:00:00.000Z'),
            change('activated-later', 'TRIAL', 'ACTIVE', '2026-10-05T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })

    it('deixa fora quem foi criado no mês, mesmo se cancelou no mês', () => {
      expect(
        churn(
          [tenant('new', 'CANCELED', { createdAt: '2026-10-02T12:00:00.000Z' })],
          [change('new', 'ACTIVE', 'CANCELED', '2026-10-10T12:00:00.000Z')],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 0, churnRate: null })
    })

    it('deixa fora quem foi criado exatamente às 00:00 do dia 1 (já é do mês novo)', () => {
      expect(
        churn([tenant('midnight', 'ACTIVE', { createdAt: '2026-10-01T03:00:00.000Z' })], []),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 0, churnRate: null })
    })

    it('nunca conta o tenant de sistema dos locatários, mesmo com histórico', () => {
      expect(
        churn(
          [tenant('renters', 'CANCELED', { total: null }), tenant('a', 'ACTIVE')],
          [change('renters', 'ACTIVE', 'CANCELED', '2026-10-03T12:00:00.000Z')],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })
  })

  describe('cancelamentos e reativações', () => {
    it('conta quem estava na base e cancelou no mês', () => {
      expect(
        churn(
          [
            tenant('a', 'ACTIVE'),
            tenant('b', 'ACTIVE'),
            tenant('c', 'ACTIVE'),
            tenant('x', 'CANCELED'),
          ],
          [change('x', 'ACTIVE', 'CANCELED', '2026-10-05T12:00:00.000Z')],
        ),
      ).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 4, churnRate: 1 / 4 })
    })

    it('cancelar e reativar no mesmo mês continua sendo churn do mês', () => {
      const tenants = [tenant('a', 'ACTIVE'), tenant('x', 'ACTIVE')]
      const canceled = [change('x', 'ACTIVE', 'CANCELED', '2026-10-05T12:00:00.000Z')]
      const reactivated = [
        ...canceled,
        change('x', 'CANCELED', 'ACTIVE', '2026-10-08T12:00:00.000Z'),
      ]

      const beforeReactivation = churn(
        tenants.map((t) => (t.id === 'x' ? { ...t, status: 'CANCELED' as const } : t)),
        canceled,
      )
      const afterReactivation = churn(tenants, reactivated)

      expect(afterReactivation).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 2,
        churnRate: 1 / 2,
      })
      expect(afterReactivation).toEqual(beforeReactivation)
    })

    it('cancelar, reativar e cancelar de novo no mesmo mês conta uma vez só', () => {
      expect(
        churn(
          [tenant('a', 'ACTIVE'), tenant('x', 'CANCELED')],
          [
            change('x', 'ACTIVE', 'CANCELED', '2026-10-03T12:00:00.000Z'),
            change('x', 'CANCELED', 'ACTIVE', '2026-10-06T12:00:00.000Z'),
            change('x', 'ACTIVE', 'CANCELED', '2026-10-20T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 2, churnRate: 1 / 2 })
    })

    it('reativar neste mês não apaga o churn do mês passado nem muda a base deste mês', () => {
      // Canceled in September and reactivated in October: the case raised in the review.
      const tenants = [tenant('a', 'ACTIVE'), tenant('x', 'ACTIVE')]
      const changes = [
        change('x', 'ACTIVE', 'CANCELED', '2026-09-20T12:00:00.000Z'),
        change('x', 'CANCELED', 'ACTIVE', '2026-10-10T12:00:00.000Z'),
      ]
      const septemberBeforeReactivation = churn(
        [tenant('a', 'ACTIVE'), tenant('x', 'CANCELED')],
        changes.slice(0, 1),
        septemberReference,
      )

      expect(churn(tenants, changes, septemberReference)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 2,
        churnRate: 1 / 2,
      })
      expect(churn(tenants, changes, septemberReference)).toEqual(septemberBeforeReactivation)
      // On October 1st it was canceled, so it is not part of October's base.
      expect(churn(tenants, changes)).toEqual({
        canceledThisMonth: 0,
        churnBaseAccounts: 1,
        churnRate: 0,
      })
    })

    it('cancelada e reativada no mês passado, e ativa neste mês, não é churn deste mês', () => {
      const changes = [
        change('x', 'ACTIVE', 'CANCELED', '2026-09-05T12:00:00.000Z'),
        change('x', 'CANCELED', 'ACTIVE', '2026-09-25T12:00:00.000Z'),
      ]

      expect(churn([tenant('a', 'ACTIVE'), tenant('x', 'ACTIVE')], changes)).toEqual({
        canceledThisMonth: 0,
        churnBaseAccounts: 2,
        churnRate: 0,
      })
    })

    it('reativada no mês passado e cancelada de novo neste mês é churn deste mês', () => {
      const changes = [
        change('x', 'ACTIVE', 'CANCELED', '2026-09-05T12:00:00.000Z'),
        change('x', 'CANCELED', 'ACTIVE', '2026-09-25T12:00:00.000Z'),
        change('x', 'ACTIVE', 'CANCELED', '2026-10-12T12:00:00.000Z'),
      ]

      expect(churn([tenant('x', 'CANCELED')], changes)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 1,
        churnRate: 1,
      })
      // September keeps its own cancellation.
      expect(churn([tenant('x', 'CANCELED')], changes, septemberReference)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 1,
        churnRate: 1,
      })
    })

    it('cancelada no mês passado, reativada e cancelada de novo neste mês não entra (não pagava no dia 1)', () => {
      expect(
        churn(
          [tenant('a', 'ACTIVE'), tenant('x', 'CANCELED')],
          [
            change('x', 'ACTIVE', 'CANCELED', '2026-09-20T12:00:00.000Z'),
            change('x', 'CANCELED', 'ACTIVE', '2026-10-03T12:00:00.000Z'),
            change('x', 'ACTIVE', 'CANCELED', '2026-10-20T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })

    it('suspender não é churn; cancelar quem já estava suspenso no dia 1 também não', () => {
      expect(
        churn(
          [
            tenant('a', 'ACTIVE'),
            tenant('suspended-now', 'SUSPENDED'),
            tenant('was-suspended', 'CANCELED'),
          ],
          [
            change('suspended-now', 'ACTIVE', 'SUSPENDED', '2026-10-04T12:00:00.000Z'),
            change('was-suspended', 'ACTIVE', 'SUSPENDED', '2026-09-10T12:00:00.000Z'),
            change('was-suspended', 'SUSPENDED', 'CANCELED', '2026-10-04T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 2, churnRate: 0 })
    })

    it('pagante no dia 1, suspensa e cancelada no mês é churn', () => {
      expect(
        churn(
          [tenant('x', 'CANCELED')],
          [
            change('x', 'ACTIVE', 'SUSPENDED', '2026-10-04T12:00:00.000Z'),
            change('x', 'SUSPENDED', 'CANCELED', '2026-10-09T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 1, churnRate: 1 })
    })

    it('teste cancelado não é churn, nem se virou pagante no mês antes de cancelar', () => {
      expect(
        churn(
          [tenant('a', 'ACTIVE'), tenant('trial', 'CANCELED'), tenant('converted', 'CANCELED')],
          [
            change('trial', 'TRIAL', 'CANCELED', '2026-10-04T12:00:00.000Z'),
            change('converted', 'TRIAL', 'ACTIVE', '2026-10-02T12:00:00.000Z'),
            change('converted', 'ACTIVE', 'CANCELED', '2026-10-09T12:00:00.000Z'),
          ],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })

    it('ignora cancelamentos depois do mês de referência', () => {
      expect(
        churn(
          [tenant('x', 'CANCELED')],
          [change('x', 'ACTIVE', 'CANCELED', '2026-11-05T12:00:00.000Z')],
        ),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 1, churnRate: 0 })
    })

    it('não depende da ordem em que o histórico chega', () => {
      const changes = [
        change('x', 'CANCELED', 'ACTIVE', '2026-10-08T12:00:00.000Z'),
        change('x', 'ACTIVE', 'CANCELED', '2026-09-20T12:00:00.000Z'),
        change('x', 'ACTIVE', 'CANCELED', '2026-10-18T12:00:00.000Z'),
      ]

      expect(churn([tenant('x', 'CANCELED')], changes)).toEqual(
        churn([tenant('x', 'CANCELED')], [...changes].reverse()),
      )
      expect(churn([tenant('x', 'CANCELED')], changes)).toEqual({
        canceledThisMonth: 0,
        churnBaseAccounts: 0,
        churnRate: null,
      })
    })
  })

  describe('virada do mês no fuso de São Paulo', () => {
    it('cancelamento às 23:30 do dia 30/09 (02:30 UTC do dia 1º) é de setembro', () => {
      const changes = [change('x', 'ACTIVE', 'CANCELED', '2026-10-01T02:30:00.000Z')]

      expect(churn([tenant('x', 'CANCELED')], changes)).toEqual({
        canceledThisMonth: 0,
        churnBaseAccounts: 0,
        churnRate: null,
      })
      expect(churn([tenant('x', 'CANCELED')], changes, septemberReference)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 1,
        churnRate: 1,
      })
    })

    it('cancelamento exatamente às 00:00 do dia 1º é do mês novo, e a conta entra na base dele', () => {
      const changes = [change('x', 'ACTIVE', 'CANCELED', '2026-10-01T03:00:00.000Z')]

      expect(churn([tenant('x', 'CANCELED')], changes)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 1,
        churnRate: 1,
      })
      expect(churn([tenant('x', 'CANCELED')], changes, septemberReference)).toEqual({
        canceledThisMonth: 0,
        churnBaseAccounts: 1,
        churnRate: 0,
      })
    })

    it('às 23:30 do dia 31/10 (já novembro em UTC) a referência ainda é outubro', () => {
      const lastEveningOfOctober = new Date('2026-11-01T02:30:00.000Z')
      const changes = [change('x', 'ACTIVE', 'CANCELED', '2026-11-01T02:00:00.000Z')]

      expect(churn([tenant('x', 'CANCELED')], changes, lastEveningOfOctober)).toEqual({
        canceledThisMonth: 1,
        churnBaseAccounts: 1,
        churnRate: 1,
      })
    })

    it('na virada do ano, 23:00 do dia 31/12 é de dezembro e não de janeiro', () => {
      const changes = [change('x', 'ACTIVE', 'CANCELED', '2027-01-01T02:00:00.000Z')]

      expect(
        churn([tenant('x', 'CANCELED')], changes, new Date('2027-01-10T15:00:00.000Z')),
      ).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 0, churnRate: null })
      expect(
        churn([tenant('x', 'CANCELED')], changes, new Date('2026-12-10T15:00:00.000Z')),
      ).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 1, churnRate: 1 })
    })
  })
})

describe('calculateChurnRate', () => {
  it('divide os cancelamentos pela base e devolve null sem base', () => {
    expect(calculateChurnRate(1, 40)).toBe(0.025)
    expect(calculateChurnRate(0, 0)).toBeNull()
  })
})
