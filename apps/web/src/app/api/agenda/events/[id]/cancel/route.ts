import { cancelAgendaEventRequestSchema } from '@server/agenda/schemas/agenda-event-input.schema'
import { parseJsonBody } from '@server/shared/http'
import type { AgendaRouteContext } from '@server/agenda/types/route-context'
import { agendaEventIdParamsSchema } from '@server/agenda/schemas/agenda-event.schema'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import { toAgendaEventResponse } from '@server/agenda/application/agenda-event-response'
import { withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: AgendaRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const body = await parseJsonBody(request, cancelAgendaEventRequestSchema)

  const event = await agendaContainer.cancelAgendaEventUseCase.execute({
    reason: body.reason,
    actorTenantId: actor.tenantId,
    actorRole: actor.role,
    actorUserId: actor.sub,
    id: (await parseRouteParams(context.params, agendaEventIdParamsSchema)).id,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
})
