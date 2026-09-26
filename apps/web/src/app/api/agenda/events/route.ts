import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import {
  createAgendaEventRequestSchema,
  listAgendaEventsQuerySchema,
} from '@server/agenda/schemas/agenda-event-input.schema'
import { toAgendaEventResponse } from '@server/agenda/schemas/agenda-event.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const parsed = listAgendaEventsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  if (parsed.data.to <= parsed.data.from) {
    throw new RequestValidationError([{ path: 'to', message: '"to" deve ser depois de "from".' }])
  }

  const events = await agendaContainer.listAgendaEventsUseCase.execute({
    actorTenantId: actor.tenantId,
    from: parsed.data.from,
    to: parsed.data.to,
    responsavelId: parsed.data.responsibleId,
  })

  return NextResponse.json({ events: events.map(toAgendaEventResponse) }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createAgendaEventRequestSchema)

  const event = await agendaContainer.createAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorPapel: actor.papel as Papel,
    responsavelId: body.responsibleId,
    imovelId: body.propertyId,
    referenciaImovelLivre: body.propertyReference,
    titulo: body.title,
    tipo: body.kind,
    inicio: body.start,
    durationMinutes: body.durationMinutes,
    participanteNome: body.participantName,
    participanteTelefone: body.participantPhone,
    notas: body.notes,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 201 })
})
