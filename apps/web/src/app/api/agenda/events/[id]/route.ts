import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import { updateAgendaEventRequestSchema } from '@server/agenda/schemas/agenda-event-input.schema'
import { toAgendaEventResponse } from '@server/agenda/schemas/agenda-event.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const event = await agendaContainer.getAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    id: (await context.params).id,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updateAgendaEventRequestSchema)

  const event = await agendaContainer.updateAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    id: (await context.params).id,
    titulo: body.title,
    tipo: body.kind,
    status: body.status,
    imovelId: body.propertyId,
    referenciaImovelLivre: body.propertyReference,
    participanteNome: body.participantName,
    participanteTelefone: body.participantPhone,
    notas: body.notes,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
})
