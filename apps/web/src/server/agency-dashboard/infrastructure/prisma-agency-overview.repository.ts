import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { AgencyActivity, AgencyBrokerSale, AgencyTopBroker } from '../types/agency-overview'
import type { AgencyOverviewRepository } from '../application/ports/agency-overview-repository.port'
import {
  currentMonthRange,
  previousMonthDueDateRange,
  previousMonthSamePeriodRange,
} from '../domain/agency-overview-periods'

function buildLocation(address: { neighborhood: string; city: string } | null): string | null {
  if (!address) return null

  const parts = [address.neighborhood, address.city].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

const RECENT_ACTIVITY_LIMIT = 10
const PER_SOURCE_ACTIVITY_LIMIT = 5
const TOP_BROKERS_LIMIT = 5
const RECENT_SALES_PER_BROKER_LIMIT = 3

export class PrismaAgencyOverviewRepository implements AgencyOverviewRepository {
  async getPortfolioCount(tenantId: string): Promise<number> {
    return prisma.property.count({ where: { tenantId } })
  }

  async getNewPropertiesThisMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = currentMonthRange(referenceDate)

    return prisma.property.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getActiveBrokersCount(tenantId: string): Promise<number> {
    return prisma.user.count({
      where: { tenantId, role: { in: ['AGENT', 'OWNER'] }, active: true },
    })
  }

  async getReceivedLeadsThisMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = currentMonthRange(referenceDate)

    return prisma.lead.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getReceivedLeadsPreviousPeriod(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = previousMonthSamePeriodRange(referenceDate)

    return prisma.lead.count({
      where: { tenantId, createdAt: { gte: start, lt: end } },
    })
  }

  async getMonthlyReceivablePreviousMonth(tenantId: string, referenceDate: Date): Promise<number> {
    const { start, end } = previousMonthDueDateRange(referenceDate)
    const aggregate = await prisma.charge.aggregate({
      _sum: { amount: true },
      where: {
        tenantId,
        type: 'RECEIVABLE',
        dueDate: { gte: start, lt: end },
        status: { not: 'CANCELED' },
      },
    })

    return aggregate._sum.amount?.toNumber() ?? 0
  }

  async getOccupancyPercentage(tenantId: string): Promise<number> {
    const [occupiedCount, listedCount] = await Promise.all([
      prisma.property.count({ where: { tenantId, status: { in: ['RENTED', 'SOLD'] } } }),
      prisma.property.count({
        where: { tenantId, status: { in: ['PUBLISHED', 'RENTED', 'SOLD'] } },
      }),
    ])

    return listedCount > 0 ? Math.round((occupiedCount / listedCount) * 100) : 0
  }

  async getTopBrokers(tenantId: string): Promise<AgencyTopBroker[]> {
    const ranking = await prisma.$queryRaw<
      { brokerId: string; salesCount: number; revenueTotal: Prisma.Decimal | number | string }[]
    >(Prisma.sql`
      SELECT o."responsibleId" AS "brokerId",
             COUNT(*)::int AS "salesCount",
             SUM(c."amount") AS "revenueTotal"
      FROM "contracts" c
      JOIN "opportunities" o ON o."id" = c."sourceOpportunityId"
      WHERE c."tenantId" = ${tenantId} AND c."status" = 'ACTIVE'
      GROUP BY o."responsibleId"
      ORDER BY "revenueTotal" DESC, MAX(COALESCE(c."activatedAt", c."createdAt")) DESC
      LIMIT ${TOP_BROKERS_LIMIT}
    `)

    if (ranking.length === 0) return []

    const brokerIds = ranking.map((entry) => entry.brokerId)
    const [brokers, recentSalesByBroker] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: brokerIds } },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          publicProfile: { select: { status: true } },
        },
      }),
      Promise.all(
        brokerIds.map((brokerId) =>
          prisma.contract.findMany({
            where: { tenantId, status: 'ACTIVE', sourceOpportunity: { responsibleId: brokerId } },
            orderBy: { activatedAt: 'desc' },
            take: RECENT_SALES_PER_BROKER_LIMIT,
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: { select: { neighborhood: true, city: true } },
                },
              },
            },
          }),
        ),
      ),
    ])
    const brokersById = new Map(brokers.map((broker) => [broker.id, broker]))

    return ranking.flatMap((entry, index) => {
      const broker = brokersById.get(entry.brokerId)
      if (!broker) return []

      return [
        {
          id: broker.id,
          name: broker.name,
          avatarUrl: broker.avatarUrl,
          hasPublicProfile: broker.publicProfile?.status === 'PUBLISHED',
          salesCount: entry.salesCount,
          revenueTotal: Number(entry.revenueTotal),
          recentSales: recentSalesByBroker[index].map((contract): AgencyBrokerSale => ({
            id: contract.id,
            propertyId: contract.property.id,
            propertyTitle: contract.property.title,
            location: buildLocation(contract.property.address),
            value: contract.amount.toNumber(),
            closedAt: contract.activatedAt ?? contract.createdAt,
          })),
        },
      ]
    })
  }

  async getRecentActivities(tenantId: string): Promise<AgencyActivity[]> {
    const [activatedContracts, newProperties, visitEvents, newLeads] = await Promise.all([
      prisma.contract.findMany({
        where: { tenantId, activatedAt: { not: null } },
        orderBy: { activatedAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: {
          property: { select: { title: true } },
          sourceOpportunity: { select: { responsible: { select: { name: true } } } },
        },
      }),
      prisma.property.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsible: { select: { name: true } } },
      }),
      prisma.agendaEvent.findMany({
        where: { tenantId, type: 'VISIT' },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsible: { select: { name: true } } },
      }),
      prisma.lead.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: PER_SOURCE_ACTIVITY_LIMIT,
        include: { responsible: { select: { name: true } } },
      }),
    ])

    const activities: AgencyActivity[] = [
      ...activatedContracts.map((contract) => ({
        id: contract.id,
        type: 'CONTRACT' as const,
        brokerName: contract.sourceOpportunity.responsible.name,
        detail: contract.property.title,
        occurredAt: contract.activatedAt as Date,
      })),
      ...newProperties.map((property) => ({
        id: property.id,
        type: 'PROPERTY' as const,
        brokerName: property.responsible?.name ?? '',
        detail: property.title,
        occurredAt: property.createdAt,
      })),
      ...visitEvents.map((event) => ({
        id: event.id,
        type: 'VISIT' as const,
        brokerName: event.responsible?.name ?? '',
        detail: event.title,
        occurredAt: event.createdAt,
      })),
      ...newLeads.map((lead) => ({
        id: lead.id,
        type: 'LEAD' as const,
        brokerName: lead.responsible?.name ?? '',
        detail: lead.name,
        occurredAt: lead.createdAt,
      })),
    ]

    return activities
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT)
  }
}
