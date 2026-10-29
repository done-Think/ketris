import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

import { toVisibleActivityProperty } from '../domain/dashboard-activity-property'
import type { DashboardOverviewRepository } from '../application/ports/dashboard-overview-repository.port'
import type {
  DashboardRecentLead,
  DashboardScope,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'

function leadWhere(scope: DashboardScope): Prisma.LeadWhereInput {
  return {
    tenantId: scope.tenantId,
    ...(scope.agentId ? { responsibleId: scope.agentId } : {}),
  }
}

function startsIn(range: TimeRange): Prisma.DateTimeFilter {
  return { gte: range.start, lt: range.end }
}

function ownEventsWhere(agentId: string): Prisma.AgendaEventWhereInput {
  return {
    responsibleId: agentId,
    OR: [{ audience: 'SHARED_TEAM', internal: false }, { audience: 'ASSIGNED_AGENT' }],
  }
}

function upcomingEventsWhere(scope: DashboardScope): Prisma.AgendaEventWhereInput {
  if (!scope.agentId) return { tenantId: scope.tenantId }

  return {
    tenantId: scope.tenantId,
    OR: [ownEventsWhere(scope.agentId), { audience: 'ALL_AGENTS' }],
  }
}

export class PrismaDashboardOverviewRepository implements DashboardOverviewRepository {
  countActiveLeads(scope: DashboardScope, createdIn?: TimeRange): Promise<number> {
    return prisma.lead.count({
      where: {
        ...leadWhere(scope),
        opportunityId: null,
        ...(createdIn ? { createdAt: startsIn(createdIn) } : {}),
      },
    })
  }

  countVisits(scope: DashboardScope, range: TimeRange): Promise<number> {
    return prisma.agendaEvent.count({
      where: {
        tenantId: scope.tenantId,
        type: 'VISIT',
        status: { not: 'CANCELLED' },
        start: startsIn(range),
        ...(scope.agentId ? ownEventsWhere(scope.agentId) : {}),
      },
    })
  }

  countOpenProposals(scope: DashboardScope, onlyAwaitingResponse: boolean): Promise<number> {
    return prisma.opportunity.count({
      where: {
        tenantId: scope.tenantId,
        archivedAt: null,
        status: { in: onlyAwaitingResponse ? ['SENT'] : ['SENT', 'IN_NEGOTIATION'] },
        ...(scope.agentId ? { responsibleId: scope.agentId } : {}),
      },
    })
  }

  async findRecentLeads(scope: DashboardScope, limit: number): Promise<DashboardRecentLead[]> {
    const rows = await prisma.lead.findMany({
      where: leadWhere(scope),
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      interest: row.interest,
      budget: row.budget,
      source: row.source,
      stage: row.stage,
      notes: row.notes,
      createdAt: row.createdAt,
    }))
  }

  async findUpcomingActivities(
    scope: DashboardScope,
    from: Date,
    limit: number,
  ): Promise<DashboardUpcomingActivity[]> {
    const rows = await prisma.agendaEvent.findMany({
      where: {
        ...upcomingEventsWhere(scope),
        status: { not: 'CANCELLED' },
        start: { gte: from },
      },
      orderBy: { start: 'asc' },
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
            address: { select: { street: true, number: true, neighborhood: true, city: true } },
          },
        },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.type,
      start: row.start,
      end: row.end,
      participantName: row.participantName,
      participantPhone: row.participantPhone,
      notes: row.notes,
      propertyId: row.propertyId,
      propertyReference: row.freeFormPropertyReference,
      property: toVisibleActivityProperty(
        row.property
          ? {
              id: row.property.id,
              title: row.property.title,
              price: row.property.price.toNumber(),
              status: row.property.status,
              address: row.property.address
                ? {
                    street: row.property.address.street,
                    number: row.property.address.number,
                    neighborhood: row.property.address.neighborhood,
                    city: row.property.address.city,
                  }
                : null,
            }
          : null,
      ),
    }))
  }
}
