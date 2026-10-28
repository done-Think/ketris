import { agendaEventInclude } from './agenda-event-query'
import type { AgendaEventWithLinks } from '../types/prisma-agenda-event'
import { assertResponsibleReservation } from './agenda-responsible-reservation'
import { recordAgendaAudit } from './agenda-audit'
import type { AgendaCancellation } from '../types/audit'
import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { AgendaEventRepository } from '../application/ports/agenda-event-repository.port'
import { selectAgendaLinkedUser } from '../domain/select-agenda-linked-user'
import type { AgendaEvent } from '../domain/agenda-event.entity'
import type {
  AgendaEventChanges,
  AgendaEventLinks,
  AgendaEventListFilters,
  AgendaEventReschedule,
  AgendaReadScope,
  NewAgendaEvent,
} from '../types/agenda-event'
import { AgendaEventUserLinkUnavailableError } from '../domain/errors'
import { assertVisitReservation, lockAgendaEvent } from './agenda-visit-reservation'

export class PrismaAgendaEventRepository implements AgendaEventRepository {
  create(event: NewAgendaEvent, links?: AgendaEventLinks): Promise<AgendaEvent> {
    return prisma.$transaction(async (transaction) => {
      await assertResponsibleReservation(transaction, event)
      await assertVisitReservation(transaction, {
        ...event,
        propertyId: event.propertyId ?? null,
        type: event.type ?? null,
      })
      const linkedUserIds = await resolveLinkedUserIds(transaction, event.tenantId, links)
      const participantUserIds = toParticipantUserIds(links, linkedUserIds)

      const created = await transaction.agendaEvent.create({
        data: {
          tenantId: event.tenantId,
          responsibleId: event.responsibleId,
          createdById: event.createdById,
          ownerUserId: links?.ownerEmail ? linkedUserIds.get(links.ownerEmail) : null,
          propertyId: event.propertyId ?? null,
          freeFormPropertyReference: event.freeFormPropertyReference ?? null,
          title: event.title,
          type: event.type ?? null,
          audience: event.audience,
          internal: event.internal,
          start: event.start,
          end: event.end,
          participantName: event.participantName,
          participantPhone: event.participantPhone,
          notes: event.notes ?? null,
          participants: participantUserIds.length
            ? { create: participantUserIds.map((userId) => ({ userId })) }
            : undefined,
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId: created.tenantId,
        eventId: created.id,
        actorUserId: event.createdById,
        action: 'CREATED',
      })
      return mapAgendaEvent(created)
    })
  }

  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]> {
    return prisma.agendaEvent
      .findMany({
        where: {
          AND: [
            readScopeWhere(filters.scope),
            {
              responsibleId: filters.responsibleId,
              start: { lt: filters.to },
              end: { gt: filters.from },
            },
          ],
        },
        include: agendaEventInclude,
        orderBy: { start: 'asc' },
      })
      .then((events) => events.map(mapAgendaEvent))
  }

  findByScopeAndId(scope: AgendaReadScope, id: string): Promise<AgendaEvent | null> {
    return prisma.agendaEvent
      .findFirst({ where: { AND: [readScopeWhere(scope), { id }] }, include: agendaEventInclude })
      .then((event) => (event ? mapAgendaEvent(event) : null))
  }

  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null> {
    return prisma.agendaEvent
      .findFirst({ where: { tenantId, id }, include: agendaEventInclude })
      .then((event) => (event ? mapAgendaEvent(event) : null))
  }

  update(
    tenantId: string,
    id: string,
    changes: AgendaEventChanges,
    links?: AgendaEventLinks,
    actorUserId?: string,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.agendaEvent.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
          responsibleId: true,
          propertyId: true,
          type: true,
          status: true,
          start: true,
          end: true,
        },
      })

      if (!existing) {
        return null
      }

      if (
        changes.start !== undefined ||
        changes.end !== undefined ||
        changes.responsibleId !== undefined ||
        (existing.status === 'CANCELLED' && changes.status && changes.status !== 'CANCELLED')
      ) {
        await assertResponsibleReservation(transaction, {
          ...existing,
          responsibleId: changes.responsibleId ?? existing.responsibleId,
          start: changes.start ?? existing.start,
          end: changes.end ?? existing.end,
          status: changes.status ?? existing.status,
        })
      }

      await assertVisitReservation(transaction, {
        ...existing,
        propertyId: changes.propertyId === undefined ? existing.propertyId : changes.propertyId,
        type: changes.type === undefined ? existing.type : changes.type,
        status: changes.status ?? existing.status,
        start: changes.start ?? existing.start,
        end: changes.end ?? existing.end,
      })

      const linkedUserIds = await resolveLinkedUserIds(transaction, tenantId, links)

      if (links?.participantEmails !== undefined) {
        await transaction.agendaEventParticipant.deleteMany({ where: { eventId: id } })

        const participantUserIds = toParticipantUserIds(links, linkedUserIds)

        if (participantUserIds.length) {
          await transaction.agendaEventParticipant.createMany({
            data: participantUserIds.map((userId) => ({ eventId: id, userId })),
          })
        }
      }

      const updated = await transaction.agendaEvent.update({
        where: { id, tenantId },
        data: {
          title: changes.title,
          start: changes.start,
          end: changes.end,
          type: changes.type,
          audience: changes.audience,
          internal: changes.internal,
          responsibleId: changes.responsibleId,
          status: changes.status,
          ...(changes.status === 'CANCELLED'
            ? {
                canceledAt: new Date(),
                canceledById: actorUserId ?? null,
                cancellationReason: changes.cancellationReason,
              }
            : {}),
          propertyId: changes.propertyId,
          freeFormPropertyReference: changes.freeFormPropertyReference,
          participantName: changes.participantName,
          participantPhone: changes.participantPhone,
          notes: changes.notes,
          ownerUserId:
            links?.ownerEmail === undefined
              ? undefined
              : links.ownerEmail === null
                ? null
                : linkedUserIds.get(links.ownerEmail),
        },
        include: agendaEventInclude,
      })

      const changedFields = [
        ...Object.entries(changes)
          .filter(([, value]) => value !== undefined)
          .map(([field]) => agendaChangeFieldNames[field] ?? field),
        ...(links?.ownerEmail !== undefined ? ['ownerEmail'] : []),
        ...(links?.participantEmails !== undefined ? ['participantEmails'] : []),
      ]
      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId,
        action: changes.status === 'CANCELLED' ? 'CANCELLED' : 'UPDATED',
        changedFields,
        cancellationReason: changes.status === 'CANCELLED' ? changes.cancellationReason : null,
      })
      return mapAgendaEvent(updated)
    })
  }

  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
    actorUserId?: string,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.agendaEvent.findFirst({
        where: { tenantId, id },
        select: {
          id: true,
          tenantId: true,
          responsibleId: true,
          propertyId: true,
          type: true,
          status: true,
          start: true,
          end: true,
        },
      })

      if (!existing) {
        return null
      }

      await assertResponsibleReservation(transaction, {
        ...existing,
        ...reschedule,
        status: 'CONFIRMED',
      })
      await assertVisitReservation(transaction, { ...existing, ...reschedule, status: 'CONFIRMED' })

      const updated = await transaction.agendaEvent.update({
        where: { id, tenantId },
        data: {
          start: reschedule.start,
          end: reschedule.end,
          status: 'CONFIRMED',
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId,
        action: 'RESCHEDULED',
        changedFields: ['start', 'end', 'status'],
      })
      return mapAgendaEvent(updated)
    })
  }

  cancel(
    tenantId: string,
    id: string,
    cancellation: AgendaCancellation,
  ): Promise<AgendaEvent | null> {
    return prisma.$transaction(async (transaction) => {
      await lockAgendaEvent(transaction, tenantId, id)
      const existing = await transaction.agendaEvent.findFirst({
        where: { tenantId, id },
        select: { id: true },
      })

      if (!existing) {
        return null
      }

      const updated = await transaction.agendaEvent.update({
        where: { id, tenantId },
        data: {
          status: 'CANCELLED',
          canceledAt: new Date(),
          canceledById: cancellation.actorUserId ?? null,
          cancellationReason: cancellation.reason,
        },
        include: agendaEventInclude,
      })

      await recordAgendaAudit(transaction, {
        tenantId,
        eventId: id,
        actorUserId: cancellation.actorUserId,
        action: 'CANCELLED',
        changedFields: ['status', 'cancellationReason'],
        cancellationReason: cancellation.reason,
      })
      return mapAgendaEvent(updated)
    })
  }

  async hasOverlap(
    tenantId: string,
    responsibleId: string,
    start: Date,
    end: Date,
    excludeEventId?: string,
  ): Promise<boolean> {
    const conflict = await prisma.agendaEvent.findFirst({
      where: {
        tenantId,
        responsibleId,
        status: { not: 'CANCELLED' },
        id: excludeEventId ? { not: excludeEventId } : undefined,
        start: { lt: end },
        end: { gt: start },
      },
      select: { id: true },
    })

    return conflict !== null
  }
}

function readScopeWhere(scope: AgendaReadScope): Prisma.AgendaEventWhereInput {
  if (scope.kind === 'tenant') {
    return { tenantId: scope.tenantId }
  }

  if (scope.kind === 'agent') {
    return {
      tenantId: scope.tenantId,
      OR: [
        { audience: 'SHARED_TEAM', internal: false },
        { audience: 'ALL_AGENTS' },
        { audience: 'ASSIGNED_AGENT', responsibleId: scope.userId },
      ],
    }
  }
  if (scope.kind === 'owner') {
    return {
      tenantId: scope.tenantId,
      internal: false,
      OR: [
        { responsibleId: scope.userId },
        { createdById: scope.userId },
        { property: { ownerId: scope.userId, tenantId: scope.tenantId } },
        { ownerUserId: scope.userId },
        { participants: { some: { userId: scope.userId } } },
      ],
    }
  }

  return {
    internal: false,
    OR: [
      { createdById: scope.userId },
      { ownerUserId: scope.userId },
      { participants: { some: { userId: scope.userId } } },
    ],
  }
}

async function resolveLinkedUserIds(
  transaction: Prisma.TransactionClient,
  eventTenantId: string,
  links: AgendaEventLinks | undefined,
): Promise<Map<string, string>> {
  const emails = new Set<string>()

  if (links?.ownerEmail) emails.add(links.ownerEmail)
  links?.participantEmails?.forEach((email) => emails.add(email))

  if (emails.size === 0) {
    return new Map()
  }

  const users = await transaction.user.findMany({
    where: {
      OR: [...emails].map((email) => ({ email: { equals: email, mode: 'insensitive' as const } })),
    },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
      active: true,
      membershipApprovedAt: true,
    },
  })
  const linkedUserIds = new Map<string, string>()

  for (const email of emails) {
    const user = selectAgendaLinkedUser(users, email, eventTenantId)

    if (!user) {
      throw new AgendaEventUserLinkUnavailableError(email)
    }

    linkedUserIds.set(email, user.id)
  }

  return linkedUserIds
}

function toParticipantUserIds(
  links: AgendaEventLinks | undefined,
  linkedUserIds: Map<string, string>,
): string[] {
  const userIds = (links?.participantEmails ?? []).map((email) => linkedUserIds.get(email))

  return [...new Set(userIds.filter((userId): userId is string => Boolean(userId)))]
}

function mapAgendaEvent(event: AgendaEventWithLinks): AgendaEvent {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsibleId: event.responsibleId,
    responsibleName: event.responsible.name,
    createdById: event.createdById,
    createdBy: event.createdBy,
    ownerUserId: event.ownerUserId,
    dono: event.ownerUser,
    participants: event.participants.map((participante) => participante.user),
    propertyId: event.propertyId,
    freeFormPropertyReference: event.freeFormPropertyReference,
    title: event.title,
    type: event.type,
    audience: event.audience,
    internal: event.internal,
    status: event.status,
    start: event.start,
    end: event.end,
    participantName: event.participantName,
    participantPhone: event.participantPhone,
    notes: event.notes,
    canceledAt: event.canceledAt,
    canceledById: event.canceledById,
    cancellationReason: event.cancellationReason,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}

const agendaChangeFieldNames: Record<string, string> = {
  start: 'start',
  end: 'end',
  audience: 'audience',
  internal: 'internal',
  responsibleId: 'responsibleId',
  title: 'title',
  type: 'kind',
  status: 'status',
  propertyId: 'propertyId',
  freeFormPropertyReference: 'propertyReference',
  participantName: 'participantName',
  participantPhone: 'participantPhone',
  notes: 'notes',
  cancellationReason: 'cancellationReason',
}
