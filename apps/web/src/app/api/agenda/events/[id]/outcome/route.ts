import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { agendaContainer } from '@server/agenda/container'
import { toAgendaEventResponse } from '@server/agenda/application/agenda-event-response'
import { recordAgendaEventOutcomeRequestSchema } from '@server/agenda/schemas/agenda-event-input.schema'
import { agendaEventIdParamsSchema } from '@server/agenda/schemas/agenda-event.schema'
import type { AgendaRouteContext } from '@server/agenda/types/route-context'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: AgendaRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, agendaEventIdParamsSchema)
  const body = await parseJsonBody(request, recordAgendaEventOutcomeRequestSchema)

  const event = await agendaContainer.recordAgendaEventOutcomeUseCase.execute({
    ...body,
    actorTenantId: actor.tenantId,
    actorRole: actor.role,
    actorUserId: actor.sub,
    id,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
})
