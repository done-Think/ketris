import type { UserRole } from '@server/auth/domain/user.entity'
import type { AgendaEvent } from '../domain/agenda-event.entity'
import type { AgendaEventLinkedUser } from '../types/agenda-event'
import type { AgendaEventResponseDTO, RenterAgendaEventResponseDTO } from '../types/http'

export function toAgendaEventResponse(event: AgendaEvent): AgendaEventResponseDTO {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsibleId: event.responsibleId,
    responsibleName: event.responsibleName,
    audience: event.audience ?? 'SHARED_TEAM',
    internal: event.internal ?? false,
    createdById: event.createdById,
    createdBy: event.createdBy ? { name: event.createdBy.name, role: event.createdBy.role } : null,
    propertyId: event.propertyId,
    propertyLabel: event.propertyLabel ?? null,
    propertyReference: event.freeFormPropertyReference,
    title: event.title,
    kind: event.type,
    status: event.status,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    participantName: event.participantName,
    participantPhone: event.participantPhone,
    notes: event.notes,
    owner: event.dono ? toLinkedUserResponse(event.dono) : null,
    participants: event.participants.map(toLinkedUserResponse),
    cancelledAt: event.canceledAt?.toISOString() ?? null,
    cancelledById: event.canceledById ?? null,
    cancellationReason: event.cancellationReason ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}

export function toRenterAgendaEventResponse(event: AgendaEvent): RenterAgendaEventResponseDTO {
  return {
    id: event.id,
    title: event.title,
    kind: event.type,
    status: event.status,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    propertyId: event.propertyId,
    propertyLabel: event.propertyLabel ?? null,
    propertyReference: event.freeFormPropertyReference,
    responsibleName: event.responsibleName,
  }
}

export function toAgendaEventReadResponse(
  event: AgendaEvent,
  actorRole: UserRole,
  actorUserId: string,
): AgendaEventResponseDTO | RenterAgendaEventResponseDTO {
  return actorRole === 'RENTER' && event.createdById !== actorUserId
    ? toRenterAgendaEventResponse(event)
    : toAgendaEventResponse(event)
}

function toLinkedUserResponse(user: AgendaEventLinkedUser) {
  return { name: user.name, email: user.email }
}
