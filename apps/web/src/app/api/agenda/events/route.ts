import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import {
  createAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
} from '@server/agenda/schemas/agenda-event-input.schema'
import {
  toAgendaEventReadResponse,
  toAgendaEventResponse,
} from '@server/agenda/application/agenda-event-response'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listAgendaEventsQuerySchema)

  const actorPapel = actor.papel
  const events = await agendaContainer.listAgendaEventsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorPapel,
    from: query.from,
    to: query.to,
    responsavelId: query.responsibleId,
  })

  return NextResponse.json(
    { events: events.map((event) => toAgendaEventReadResponse(event, actorPapel, actor.sub)) },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createAgendaEventRequestSchema)

  const event = await agendaContainer.createAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorPapel: actor.papel,
    responsavelId: body.responsibleId,
    destino: body.audience,
    interno: body.internal,
    imovelId: body.propertyId,
    referenciaImovelLivre: body.propertyReference,
    titulo: body.title,
    tipo: body.kind,
    inicio: body.start,
    outsideBusinessHoursConfirmed: body.outsideBusinessHoursConfirmed,
    durationMinutes: body.durationMinutes,
    participanteNome: body.participantName,
    participanteTelefone: body.participantPhone,
    notas: body.notes,
    donoEmail: body.ownerEmail,
    participanteEmails: body.participantEmails,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 201 })
})
