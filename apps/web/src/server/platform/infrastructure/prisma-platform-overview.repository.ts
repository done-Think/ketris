import { prisma } from '@server/db/prisma'

import type { PlatformGrowthMonth, PlatformRecentTenant } from '../types/platform-overview'
import type { PlatformOverviewRepository } from '../application/ports/platform-overview-repository.port'
import type { PlatformOverviewCounts } from '../types/platform-overview-repository'

const RECENT_TENANTS_LIMIT = 5
const GROWTH_MONTHS_BACK = 5

function monthRange(referenceDate: Date, monthsBack: number) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - monthsBack, 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)

  return { start, end }
}

export class PrismaPlatformOverviewRepository implements PlatformOverviewRepository {
  async getOverview(referenceDate: Date): Promise<PlatformOverviewCounts> {
    const seriesWindow = monthRange(referenceDate, GROWTH_MONTHS_BACK)

    const [
      tenantsCount,
      brokersCount,
      propertiesCount,
      recentTenants,
      tenantsForSeries,
      contractsForSeries,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count({ where: { role: { in: ['AGENT', 'OWNER'] } } }),
      prisma.property.count(),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_TENANTS_LIMIT,
        include: {
          _count: {
            select: {
              users: { where: { role: { in: ['AGENT', 'OWNER'] } } },
              properties: true,
            },
          },
        },
      }),
      prisma.tenant.findMany({
        where: { createdAt: { gte: seriesWindow.start, lt: seriesWindow.end } },
        select: { createdAt: true },
      }),
      prisma.contract.findMany({
        where: { activatedAt: { gte: seriesWindow.start, lt: seriesWindow.end } },
        select: { activatedAt: true },
      }),
    ])

    const growthTrend: PlatformGrowthMonth[] = Array.from(
      { length: GROWTH_MONTHS_BACK + 1 },
      (_, index) => {
        const date = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() - (GROWTH_MONTHS_BACK - index),
          1,
        )
        return { year: date.getFullYear(), month: date.getMonth() + 1, tenants: 0, contracts: 0 }
      },
    )

    for (const tenant of tenantsForSeries) {
      const bucket = growthTrend.find(
        (entry) =>
          entry.year === tenant.createdAt.getFullYear() &&
          entry.month === tenant.createdAt.getMonth() + 1,
      )
      if (bucket) bucket.tenants += 1
    }

    for (const contract of contractsForSeries) {
      const activatedAt = contract.activatedAt
      if (!activatedAt) continue

      const bucket = growthTrend.find(
        (entry) =>
          entry.year === activatedAt.getFullYear() && entry.month === activatedAt.getMonth() + 1,
      )
      if (bucket) bucket.contracts += 1
    }

    const recentTenantsMapped: PlatformRecentTenant[] = recentTenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      brokersCount: tenant._count.users,
      propertiesCount: tenant._count.properties,
      createdAt: tenant.createdAt,
    }))

    return {
      metrics: { tenantsCount, brokersCount, propertiesCount },
      growthTrend,
      recentTenants: recentTenantsMapped,
    }
  }
}
