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

  const actorRole = actor.role
  const events = await agendaContainer.listAgendaEventsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorRole,
    from: query.from,
    to: query.to,
    responsibleId: query.responsibleId,
  })

  return NextResponse.json(
    { events: events.map((event) => toAgendaEventReadResponse(event, actorRole, actor.sub)) },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createAgendaEventRequestSchema)

  const event = await agendaContainer.createAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorRole: actor.role,
    responsibleId: body.responsibleId,
    audience: body.audience,
    internal: body.internal,
    propertyId: body.propertyId,
    freeFormPropertyReference: body.propertyReference,
    title: body.title,
    type: body.kind,
    start: body.start,
    outsideBusinessHoursConfirmed: body.outsideBusinessHoursConfirmed,
    durationMinutes: body.durationMinutes,
    participantName: body.participantName,
    participantPhone: body.participantPhone,
    notes: body.notes,
    ownerEmail: body.ownerEmail,
    participantEmails: body.participantEmails,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 201 })
})
