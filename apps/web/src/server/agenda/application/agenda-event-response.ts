import type { Papel } from '@server/auth/domain/user.entity'
import type { AgendaEvent } from '../domain/agenda-event.entity'
import type { AgendaEventLinkedUser } from '../types/agenda-event'
import type { AgendaEventResponseDTO, RenterAgendaEventResponseDTO } from '../types/http'

export function toAgendaEventResponse(event: AgendaEvent): AgendaEventResponseDTO {
  return {
    id: event.id,
    tenantId: event.tenantId,
    responsibleId: event.responsavelId,
    responsibleName: event.responsavelNome,
    audience: event.destino ?? 'SHARED_TEAM',
    internal: event.interno ?? false,
    createdById: event.criadoPorId,
    createdBy: event.criadoPor ? { name: event.criadoPor.nome, role: event.criadoPor.papel } : null,
    propertyId: event.imovelId,
    propertyLabel: event.propertyLabel ?? null,
    propertyReference: event.referenciaImovelLivre,
    title: event.titulo,
    kind: event.tipo,
    status: event.status,
    start: event.inicio.toISOString(),
    end: event.fim.toISOString(),
    participantName: event.participanteNome,
    participantPhone: event.participanteTelefone,
    notes: event.notas,
    owner: event.dono ? toLinkedUserResponse(event.dono) : null,
    participants: event.participantes.map(toLinkedUserResponse),
    cancelledAt: event.canceladoEm?.toISOString() ?? null,
    cancelledById: event.canceladoPorId ?? null,
    cancellationReason: event.motivoCancelamento ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}

export function toRenterAgendaEventResponse(event: AgendaEvent): RenterAgendaEventResponseDTO {
  return {
    id: event.id,
    title: event.titulo,
    kind: event.tipo,
    status: event.status,
    start: event.inicio.toISOString(),
    end: event.fim.toISOString(),
    propertyId: event.imovelId,
    propertyLabel: event.propertyLabel ?? null,
    propertyReference: event.referenciaImovelLivre,
    responsibleName: event.responsavelNome,
  }
}

export function toAgendaEventReadResponse(
  event: AgendaEvent,
  actorPapel: Papel,
  actorUserId: string,
): AgendaEventResponseDTO | RenterAgendaEventResponseDTO {
  return actorPapel === 'RENTER' && event.criadoPorId !== actorUserId
    ? toRenterAgendaEventResponse(event)
    : toAgendaEventResponse(event)
}

function toLinkedUserResponse(user: AgendaEventLinkedUser) {
  return { name: user.nome, email: user.email }
}
