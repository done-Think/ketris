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

  const actorPapel = actor.papel
  const event = await agendaContainer.getAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorPapel,
    id: (await parseRouteParams(context.params, agendaEventIdParamsSchema)).id,
  })

  return NextResponse.json(
    { event: toAgendaEventReadResponse(event, actorPapel, actor.sub) },
    { status: 200 },
  )
})

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: AgendaRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const body = await parseJsonBody(request, updateAgendaEventRequestSchema)

    const event = await agendaContainer.updateAgendaEventUseCase.execute({
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel,
      actorUserId: actor.sub,
      id: (await parseRouteParams(context.params, agendaEventIdParamsSchema)).id,
      destino: body.audience,
      inicio: body.start,
      outsideBusinessHoursConfirmed: body.outsideBusinessHoursConfirmed,
      durationMinutes: body.durationMinutes,
      interno: body.internal,
      responsavelId: body.responsibleId,
      titulo: body.title,
      tipo: body.kind,
      status: body.status,
      motivoCancelamento: body.cancellationReason,
      imovelId: body.propertyId,
      referenciaImovelLivre: body.propertyReference,
      participanteNome: body.participantName,
      participanteTelefone: body.participantPhone,
      notas: body.notes,
      donoEmail: body.ownerEmail,
      participanteEmails: body.participantEmails,
    })

    return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
  },
)
