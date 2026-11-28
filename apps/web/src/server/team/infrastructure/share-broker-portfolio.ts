import { updateCrmPortfolioAccess } from './crm-portfolio-access'
import type { Prisma } from '@prisma/client'
import { recordUserAudit } from '@server/auth/infrastructure/user-audit'
import {
  readPropertyAccessHistory,
  recordPropertyAccessHistory,
} from '@server/properties/infrastructure/property-access-history'
import { InvalidTransferDestinationError, TeamMemberNotFoundError } from '../domain/errors'
import type { TeamPortfolioAccessCommand } from '../types/team-repository'
import type { TeamTransferResult } from '../types/team'
import { lockPortfolioPeople } from './property-portfolio'
import { lockAgendaEvent } from '@server/agenda/infrastructure/agenda-visit-reservation'

export async function shareBrokerPortfolio(
  tx: Prisma.TransactionClient,
  command: TeamPortfolioAccessCommand,
): Promise<TeamTransferResult> {
  const { tenantId, sourceId, destinationId, items, actor, now } = command
  await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`crm:${tenantId}`}, 0))`
  await lockPortfolioPeople(tx, command)
  const source = await tx.user.findFirst({
    where: { tenantId, id: sourceId, OR: [{ role: 'AGENT' }, { role: 'OWNER', id: actor.id }] },
    select: { id: true },
  })
  if (!source) throw new TeamMemberNotFoundError()
  const destination = await tx.user.findFirst({
    where: { tenantId, id: destinationId, role: 'AGENT' },
    select: { id: true },
  })
  if (!destination || sourceId === destinationId) throw new InvalidTransferDestinationError()
  const result: TeamTransferResult = {
    propertyIds: [],
    leadIds: [],
    opportunityIds: [],
    eventIds: [],
  }
  if (items.properties) {
    const propertyScope: Prisma.PropertyWhereInput = {
      tenantId,
      OR: [
        { responsibleId: sourceId },
        {
          brokerAccess: {
            some: {
              tenantId,
              userId: sourceId,
              user: {
                active: true,
                role: 'AGENT',
                membershipApprovedAt: { not: null },
                OR: [{ teamInvitation: null }, { teamInvitation: { acceptedAt: { not: null } } }],
              },
            },
          },
        },
      ],
    }
    const properties = await tx.property.findMany({
      where: propertyScope,
      select: { id: true },
    })
    const before = await readPropertyAccessHistory(
      tx,
      tenantId,
      properties.map((row) => row.id),
    )
    const authorized = await tx.property.findMany({
      where: { AND: [propertyScope, { id: { in: before.map((row) => row.id) } }] },
      select: { id: true, responsibleId: true },
    })
    const existing = await tx.propertyBrokerAccess.findMany({
      where: { tenantId, userId: destinationId },
      select: { propertyId: true },
    })
    const existingIds = new Set(existing.map((row) => row.propertyId))
    const targets = authorized.filter(
      (row) =>
        row.responsibleId !== destinationId &&
        (command.revoke ? existingIds.has(row.id) : !existingIds.has(row.id)),
    )
    if (command.revoke) {
      await tx.propertyBrokerAccess.deleteMany({
        where: {
          tenantId,
          userId: destinationId,
          propertyId: { in: targets.map((row) => row.id) },
        },
      })
    } else if (targets.length)
      await tx.propertyBrokerAccess.createMany({
        data: targets.map((row) => ({ tenantId, propertyId: row.id, userId: destinationId })),
        skipDuplicates: true,
      })
    await recordPropertyAccessHistory(tx, tenantId, before, actor.id)
    result.propertyIds = targets.map((row) => row.id)
  }
  const crmAccess = await updateCrmPortfolioAccess(tx, command)
  result.leadIds = crmAccess.leadIds
  result.opportunityIds = crmAccess.opportunityIds
  if (items.futureEvents) {
    const events = await tx.agendaEvent.findMany({
      where: {
        tenantId,
        responsibleId: sourceId,
        start: { gte: now },
        status: { in: ['CONFIRMED', 'PENDING', 'RESCHEDULE'] },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    })
    for (const event of events) {
      await lockAgendaEvent(tx, tenantId, event.id)
      const current = await tx.agendaEvent.findFirst({
        where: {
          tenantId,
          id: event.id,
          responsibleId: sourceId,
          start: { gte: now },
          status: { in: ['CONFIRMED', 'PENDING', 'RESCHEDULE'] },
        },
        select: { id: true, ownerUserId: true },
      })
      if (!current || current.ownerUserId === destinationId) continue
      const shared = command.revoke
        ? await tx.agendaEventParticipant.deleteMany({
            where: { eventId: current.id, userId: destinationId },
          })
        : await tx.agendaEventParticipant.createMany({
            data: [{ eventId: current.id, userId: destinationId }],
            skipDuplicates: true,
          })
      if (!shared.count) continue
      await tx.agendaEventAudit.create({
        data: {
          tenantId,
          eventId: current.id,
          actorUserId: actor.id,
          action: 'UPDATED',
          changedFields: ['participants'],
        },
      })
      result.eventIds.push(current.id)
    }
  }
  for (const [entityType, ids] of [
    ['LEAD', result.leadIds],
    ['OPPORTUNITY', result.opportunityIds],
  ] as const) {
    if (ids.length)
      await tx.crmAuditEvent.createMany({
        data: ids.map((entityId) => ({
          tenantId,
          entityType,
          entityId,
          actorUserId: actor.id,
          actorRole: 'OWNER',
          action: 'UPDATED',
          changedFields: ['brokerAccess'],
        })),
      })
  }
  await recordUserAudit(tx, {
    tenantId,
    userId: destinationId,
    action: 'UPDATED',
    actor: { kind: 'USER', id: actor.id },
    changedFields: Object.entries(items)
      .filter(([, selected]) => selected)
      .map(([field]) => field),
  })
  return result
}
