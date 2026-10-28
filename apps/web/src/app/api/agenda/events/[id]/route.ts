import type { AgendaRouteContext } from '@server/agenda/types/route-context'
import { agendaEventIdParamsSchema } from '@server/agenda/schemas/agenda-event.schema'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import { updateAgendaEventRequestSchema } from '@server/agenda/schemas/agenda-event-input.schema'
import {
  toAgendaEventReadResponse,
  toAgendaEventResponse,
} from '@server/agenda/application/agenda-event-response'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: AgendaRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const actorRole = actor.role
  const event = await agendaContainer.getAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorRole,
    id: (await parseRouteParams(context.params, agendaEventIdParamsSchema)).id,
  })

  return NextResponse.json(
    { event: toAgendaEventReadResponse(event, actorRole, actor.sub) },
    { status: 200 },
  )
})

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: AgendaRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const body = await parseJsonBody(request, updateAgendaEventRequestSchema)

    const event = await agendaContainer.updateAgendaEventUseCase.execute({
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
      actorUserId: actor.sub,
      id: (await parseRouteParams(context.params, agendaEventIdParamsSchema)).id,
      audience: body.audience,
      start: body.start,
      outsideBusinessHoursConfirmed: body.outsideBusinessHoursConfirmed,
      durationMinutes: body.durationMinutes,
      internal: body.internal,
      responsibleId: body.responsibleId,
      title: body.title,
      type: body.kind,
      status: body.status,
      cancellationReason: body.cancellationReason,
      propertyId: body.propertyId,
      freeFormPropertyReference: body.propertyReference,
      participantName: body.participantName,
      participantPhone: body.participantPhone,
      notes: body.notes,
      ownerEmail: body.ownerEmail,
      participantEmails: body.participantEmails,
    })

    return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
  },
)
