import type { Prisma, Tenant } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { PlatformTenantRepository } from '../application/ports/platform-tenant-repository.port'
import type { NewTenantStatusChange } from '../types/platform-tenant-repository'
import type { PlatformTenant } from '../types/platform-tenant'
import type { TenantUsage } from '../types/platform-plan'
import type { TenantAccount } from '../types/tenant-account'
import type { TenantStatusChange } from '../types/tenant-status-history'
import type { TenantListQuery, TenantPage, TenantStatusCounts } from '../types/tenant-list'

function toDomainPlatformTenant(tenant: Tenant): PlatformTenant {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    accountType: tenant.accountType,
    status: tenant.status,
    canceledAt: tenant.canceledAt,
    createdAt: tenant.createdAt,
  }
}

function tenantWhere({
  q,
  status,
  accountType,
}: Pick<TenantListQuery, 'q' | 'status' | 'accountType'>): Prisma.TenantWhereInput {
  const term = q?.trim()

  return {
    ...(status ? { status } : {}),
    ...(accountType ? { accountType } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term.toLowerCase() } },
          ],
        }
      : {}),
  }
}

export class PrismaPlatformTenantRepository implements PlatformTenantRepository {
  async findPage(query: TenantListQuery): Promise<TenantPage> {
    const where = tenantWhere(query)
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.tenant.count({ where }),
    ])

    return { items: tenants.map(toDomainPlatformTenant), totalCount }
  }

  async countByStatus(
    query: Pick<TenantListQuery, 'q' | 'accountType'>,
  ): Promise<TenantStatusCounts> {
    const rows = await prisma.tenant.groupBy({
      by: ['status'],
      where: tenantWhere(query),
      _count: { _all: true },
    })
    const counts: TenantStatusCounts = { TRIAL: 0, ACTIVE: 0, SUSPENDED: 0, CANCELED: 0 }
    for (const row of rows) counts[row.status] = row._count._all

    return counts
  }

  async findMany(): Promise<PlatformTenant[]> {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } })

    return tenants.map(toDomainPlatformTenant)
  }

  async findById(tenantId: string): Promise<PlatformTenant | null> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    return tenant ? toDomainPlatformTenant(tenant) : null
  }

  async updateAccount(
    tenantId: string,
    expected: Pick<TenantAccount, 'accountType' | 'status'>,
    account: TenantAccount,
    statusChange: NewTenantStatusChange | null,
  ): Promise<PlatformTenant | null> {
    return prisma.$transaction(async (transaction) => {
      const { count } = await transaction.tenant.updateMany({
        where: { id: tenantId, accountType: expected.accountType, status: expected.status },
        data: {
          accountType: account.accountType,
          status: account.status,
          canceledAt: account.canceledAt,
        },
      })

      if (count === 0) {
        return null
      }

      if (statusChange) {
        await transaction.tenantStatusChange.create({ data: { tenantId, ...statusChange } })
      }

      const tenant = await transaction.tenant.findUniqueOrThrow({ where: { id: tenantId } })

      return toDomainPlatformTenant(tenant)
    })
  }

  async findStatusChanges(since: Date): Promise<TenantStatusChange[]> {
    const [lastBefore, fromSince] = await Promise.all([
      prisma.$queryRaw<TenantStatusChange[]>`
        SELECT DISTINCT ON ("tenantId") "tenantId", "fromStatus", "toStatus", "changedAt"
        FROM "tenant_status_changes"
        WHERE "changedAt" < ${since}
        ORDER BY "tenantId", "changedAt" DESC
      `,
      prisma.tenantStatusChange.findMany({
        where: { changedAt: { gte: since } },
        orderBy: { changedAt: 'asc' },
        select: { tenantId: true, fromStatus: true, toStatus: true, changedAt: true },
      }),
    ])

    return [...lastBefore, ...fromSince].sort(
      (a, b) => a.changedAt.getTime() - b.changedAt.getTime(),
    )
  }

  async countUsage(tenantIds?: string[]): Promise<Map<string, TenantUsage>> {
    const scope = tenantIds ? { tenantId: { in: tenantIds } } : {}
    const [properties, brokers] = await Promise.all([
      prisma.property.groupBy({
        by: ['tenantId'],
        where: { ...scope, status: { not: 'INACTIVE' } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ['tenantId'],
        where: { ...scope, role: { in: ['AGENT', 'OWNER'] }, active: true },
        _count: { _all: true },
      }),
    ])

    const usage = new Map<string, TenantUsage>()
    const usageOf = (tenantId: string) => {
      const current = usage.get(tenantId) ?? { properties: 0, brokers: 0 }
      usage.set(tenantId, current)
      return current
    }
    for (const row of properties) usageOf(row.tenantId).properties = row._count._all
    for (const row of brokers) usageOf(row.tenantId).brokers = row._count._all

    return usage
  }
}
