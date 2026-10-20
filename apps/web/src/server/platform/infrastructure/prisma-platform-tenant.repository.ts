import type { Tenant } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  NewTenantStatusChange,
  PlatformTenantRepository,
} from '../application/ports/platform-tenant-repository.port'
import type { PlatformTenant } from '../domain/platform-tenant.entity'
import type { TenantUsage } from '../domain/platform-plan'
import type { TenantAccount, TenantStatus } from '../domain/tenant-account'
import type { TenantStatusChange } from '../domain/tenant-status-history'

function toDomainPlatformTenant(tenant: Tenant): PlatformTenant {
  return {
    id: tenant.id,
    nome: tenant.nome,
    slug: tenant.slug,
    accountType: tenant.accountType,
    status: tenant.status,
    canceledAt: tenant.canceledAt,
    createdAt: tenant.createdAt,
  }
}

export class PrismaPlatformTenantRepository implements PlatformTenantRepository {
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
    expectedStatus: TenantStatus,
    account: TenantAccount,
    statusChange: NewTenantStatusChange | null,
  ): Promise<PlatformTenant | null> {
    return prisma.$transaction(async (transaction) => {
      const { count } = await transaction.tenant.updateMany({
        where: { id: tenantId, status: expectedStatus },
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

  async findStatusChanges(): Promise<TenantStatusChange[]> {
    const changes = await prisma.tenantStatusChange.findMany({
      orderBy: { changedAt: 'asc' },
      select: { tenantId: true, fromStatus: true, toStatus: true, changedAt: true },
    })

    return changes
  }

  async countUsage(): Promise<Map<string, TenantUsage>> {
    const [properties, brokers] = await Promise.all([
      prisma.imovel.groupBy({
        by: ['tenantId'],
        where: { status: { not: 'INACTIVE' } },
        _count: { _all: true },
      }),
      // Same definition as the agency dashboard's "active brokers".
      prisma.usuario.groupBy({
        by: ['tenantId'],
        where: { papel: { in: ['AGENT', 'OWNER'] }, ativo: true },
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
