import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { recordUserAudit } from '@server/auth/infrastructure/user-audit'

import type { TeamRepository } from '../application/ports/team-repository.port'
import type { TeamGoalChange, TeamPeriod, TeamTransferResult } from '../types/team'
import type {
  TeamMemberRow,
  TeamMetricRows,
  TeamStaffUser,
  TeamTransferCommand,
} from '../types/team-repository'

const staffRoles = ['AGENT', 'OWNER'] as const

const openOpportunityWhere = {
  archivedAt: null,
  status: { not: 'REJECTED' },
  contract: { is: null },
} satisfies Prisma.OpportunityWhereInput

function countMap(rows: { key: string | null; count: number }[]): Map<string, number> {
  return new Map(rows.flatMap((row) => (row.key ? [[row.key, row.count] as const] : [])))
}

async function moveItems(
  tx: Prisma.TransactionClient,
  { tenantId, sourceId, destinationId, items, opportunityScope, now, actor }: TeamTransferCommand,
): Promise<TeamTransferResult> {
  const [properties, leads, opportunities, events] = await Promise.all([
    items.properties
      ? tx.property.findMany({ where: { tenantId, responsibleId: sourceId }, select: { id: true } })
      : [],
    items.leads
      ? tx.lead.findMany({ where: { tenantId, responsibleId: sourceId }, select: { id: true } })
      : [],
    items.opportunities
      ? tx.opportunity.findMany({
          where: {
            tenantId,
            responsibleId: sourceId,
            ...(opportunityScope === 'open' ? openOpportunityWhere : {}),
          },
          select: { id: true },
        })
      : [],
    items.futureEvents
      ? tx.agendaEvent.findMany({
          where: {
            tenantId,
            responsibleId: sourceId,
            start: { gte: now },
            status: { not: 'CANCELLED' },
          },
          select: { id: true },
        })
      : [],
  ])
  const result = {
    propertyIds: properties.map(({ id }) => id),
    leadIds: leads.map(({ id }) => id),
    opportunityIds: opportunities.map(({ id }) => id),
    eventIds: events.map(({ id }) => id),
  }
  await Promise.all([
    result.propertyIds.length
      ? tx.property.updateMany({
          where: { tenantId, id: { in: result.propertyIds } },
          data: { responsibleId: destinationId, updatedById: actor.id },
        })
      : null,
    result.leadIds.length
      ? tx.lead.updateMany({
          where: { tenantId, id: { in: result.leadIds } },
          data: { responsibleId: destinationId, updatedById: actor.id },
        })
      : null,
    result.opportunityIds.length
      ? tx.opportunity.updateMany({
          where: { tenantId, id: { in: result.opportunityIds } },
          data: { responsibleId: destinationId, updatedById: actor.id },
        })
      : null,
    result.eventIds.length
      ? tx.agendaEvent.updateMany({
          where: { tenantId, id: { in: result.eventIds } },
          data: { responsibleId: destinationId, updatedById: actor.id },
        })
      : null,
    result.eventIds.length
      ? tx.agendaEvent.updateMany({
          where: { tenantId, id: { in: result.eventIds }, ownerUserId: sourceId },
          data: { ownerUserId: destinationId, updatedById: actor.id },
        })
      : null,
  ])

  return result
}

async function recordTransfer(
  tx: Prisma.TransactionClient,
  command: TeamTransferCommand,
  result: TeamTransferResult,
) {
  const people = await tx.user.findMany({
    where: { tenantId: command.tenantId, id: { in: [command.sourceId, command.destinationId] } },
    select: { id: true, name: true },
  })
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? ''
  await tx.portfolioTransfer.create({
    data: {
      tenantId: command.tenantId,
      reason: command.reason,
      sourceId: command.sourceId,
      sourceName: nameOf(command.sourceId),
      targetId: command.destinationId,
      targetName: nameOf(command.destinationId),
      authorId: command.actor.id,
      authorName: command.actor.name,
      propertyIds: result.propertyIds,
      leadIds: result.leadIds,
      eventIds: result.eventIds,
      opportunityIds: result.opportunityIds,
    },
  })
}

export class PrismaTeamRepository implements TeamRepository {
  async listMembers(tenantId: string): Promise<TeamMemberRow[]> {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: 'AGENT',
        OR: [{ membershipApprovedAt: { not: null } }, { teamInvitation: { isNot: null } }],
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        active: true,
        publicProfile: {
          select: { headline: true, specialties: true, phone: true, status: true },
        },
        teamInvitation: { select: { sentAt: true, expiresAt: true, acceptedAt: true } },
      },
    })
    const now = Date.now()

    return users.map((user) => {
      const invitation = user.teamInvitation
      const pending = invitation && !invitation.acceptedAt

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? user.publicProfile?.phone ?? null,
        avatarUrl: user.avatarUrl,
        headline: user.publicProfile?.headline ?? null,
        specialties: user.publicProfile?.specialties ?? [],
        hasPublicProfile: user.publicProfile?.status === 'PUBLISHED',
        active: user.active,
        invitation: pending
          ? {
              status: invitation.expiresAt.getTime() < now ? 'EXPIRED' : 'PENDING',
              sentAt: invitation.sentAt,
              expiresAt: invitation.expiresAt,
            }
          : null,
      }
    })
  }

  async loadMetrics(
    tenantId: string,
    memberIds: string[],
    period: TeamPeriod,
  ): Promise<TeamMetricRows> {
    if (!memberIds.length)
      return {
        properties: new Map(),
        openLeads: new Map(),
        openOpportunities: new Map(),
        monthlySales: new Map(),
        returns: new Map(),
        responseMinutes: new Map(),
        goals: new Map(),
      }
    const ids = Prisma.join(memberIds)
    const [
      properties,
      openLeads,
      openOpportunities,
      sales,
      returns,
      leadResponses,
      opportunityResponses,
      goals,
    ] = await Promise.all([
      prisma.property.groupBy({
        by: ['responsibleId'],
        where: { tenantId, responsibleId: { in: memberIds }, status: { not: 'INACTIVE' } },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['responsibleId'],
        where: { tenantId, responsibleId: { in: memberIds }, opportunityId: null },
        _count: { _all: true },
      }),
      prisma.opportunity.groupBy({
        by: ['responsibleId'],
        where: {
          tenantId,
          responsibleId: { in: memberIds },
          ...openOpportunityWhere,
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ key: string; count: number }[]>`
          SELECT o."responsibleId" AS key, COUNT(*)::int AS count
          FROM contracts c JOIN opportunities o ON o.id = c."sourceOpportunityId"
          WHERE c."tenantId" = ${tenantId} AND o."responsibleId" IN (${ids})
            AND c."activatedAt" >= ${period.monthStart} AND c."activatedAt" < ${period.monthEnd}
            AND c.status::text <> 'CANCELED'
          GROUP BY o."responsibleId"`,
      prisma.opportunityActivity.groupBy({
        by: ['authorId'],
        where: {
          type: 'CONTACT_MADE',
          authorId: { in: memberIds },
          createdAt: { gte: period.monthStart, lt: period.monthEnd },
          opportunity: { tenantId },
        },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ key: string; minutes: number }[]>`
          SELECT "responsibleId" AS key,
                 EXTRACT(EPOCH FROM ("firstContactAt" - "createdAt")) / 60 AS minutes
          FROM leads
          WHERE "tenantId" = ${tenantId} AND "responsibleId" IN (${ids})
            AND "createdAt" >= ${period.responseWindowStart} AND "firstContactAt" IS NOT NULL`,
      prisma.$queryRaw<{ key: string; minutes: number }[]>`
          SELECT o."responsibleId" AS key,
                 EXTRACT(EPOCH FROM (MIN(a."createdAt") - o."createdAt")) / 60 AS minutes
          FROM opportunities o
          JOIN opportunity_activities a
            ON a."opportunityId" = o.id AND a."authorId" = o."responsibleId"
          WHERE o."tenantId" = ${tenantId} AND o."responsibleId" IN (${ids})
            AND o."createdAt" >= ${period.responseWindowStart}
          GROUP BY o.id, o."responsibleId", o."createdAt"`,
      prisma.brokerGoal.findMany({
        where: { tenantId, userId: { in: memberIds } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        distinct: ['userId'],
      }),
    ])
    const responseMinutes = new Map<string, number[]>()
    for (const row of [...leadResponses, ...opportunityResponses]) {
      const minutes = Math.max(0, Number(row.minutes))
      responseMinutes.set(row.key, [...(responseMinutes.get(row.key) ?? []), minutes])
    }

    return {
      properties: countMap(
        properties.map((row) => ({ key: row.responsibleId, count: row._count._all })),
      ),
      openLeads: countMap(
        openLeads.map((row) => ({ key: row.responsibleId, count: row._count._all })),
      ),
      openOpportunities: countMap(
        openOpportunities.map((row) => ({ key: row.responsibleId, count: row._count._all })),
      ),
      monthlySales: countMap(sales),
      returns: countMap(returns.map((row) => ({ key: row.authorId, count: row._count._all }))),
      responseMinutes,
      goals: new Map(
        goals.map((goal) => [
          goal.userId,
          {
            monthlySales: goal.monthlySales,
            setAt: goal.createdAt,
            setByName: goal.definedByName,
          },
        ]),
      ),
    }
  }

  async findStaffUser(tenantId: string, userId: string): Promise<TeamStaffUser | null> {
    const user = await prisma.user.findFirst({
      where: { tenantId, id: userId, role: { in: [...staffRoles] } },
      select: {
        id: true,
        name: true,
        role: true,
        active: true,
        teamInvitation: { select: { acceptedAt: true } },
      },
    })

    return user
      ? {
          id: user.id,
          name: user.name,
          role: user.role,
          active: user.active,
          pendingInvitation: Boolean(user.teamInvitation && !user.teamInvitation.acceptedAt),
        }
      : null
  }

  async transfer(command: TeamTransferCommand): Promise<TeamTransferResult> {
    return prisma.$transaction(async (tx) => {
      const result = await moveItems(tx, command)
      await recordTransfer(tx, command, result)
      return result
    })
  }

  async deactivateWithTransfer(command: TeamTransferCommand): Promise<TeamTransferResult> {
    return prisma.$transaction(async (tx) => {
      const result = await moveItems(tx, command)
      await recordTransfer(tx, command, result)
      await tx.user.updateMany({
        where: { tenantId: command.tenantId, id: command.sourceId },
        data: { active: false, sessionVersion: { increment: 1 } },
      })
      await tx.refreshToken.updateMany({
        where: { userId: command.sourceId, tenantId: command.tenantId, revokedAt: null },
        data: { revokedAt: command.now },
      })
      await recordUserAudit(tx, {
        userId: command.sourceId,
        tenantId: command.tenantId,
        action: 'DEACTIVATED',
        actor: { kind: 'USER', id: command.actor.id },
        changedFields: ['active'],
      })
      return result
    })
  }

  async activate(tenantId: string, userId: string, actorId: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { tenantId, id: userId, active: false },
        data: { active: true },
      })
      if (count)
        await recordUserAudit(tx, {
          userId,
          tenantId,
          action: 'UPDATED',
          actor: { kind: 'USER', id: actorId },
          changedFields: ['active'],
        })
      return count > 0
    })
  }

  async setGoal(
    tenantId: string,
    userId: string,
    monthlySales: number,
    actor: { id: string; name: string },
  ): Promise<TeamGoalChange> {
    const goal = await prisma.brokerGoal.create({
      data: {
        tenantId,
        userId: userId,
        monthlySales: monthlySales,
        definedById: actor.id,
        definedByName: actor.name,
      },
    })

    return {
      id: goal.id,
      monthlySales: goal.monthlySales,
      setAt: goal.createdAt,
      setByName: goal.definedByName,
    }
  }

  async listGoals(tenantId: string, userId: string, limit: number): Promise<TeamGoalChange[]> {
    const goals = await prisma.brokerGoal.findMany({
      where: { tenantId, userId: userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    })

    return goals.map((goal) => ({
      id: goal.id,
      monthlySales: goal.monthlySales,
      setAt: goal.createdAt,
      setByName: goal.definedByName,
    }))
  }
}
