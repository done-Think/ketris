import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { agendaContainer } from '@server/agenda/container'
import { rescheduleAgendaEventRequestSchema } from '@server/agenda/schemas/agenda-event-input.schema'
import { toAgendaEventResponse } from '@server/agenda/schemas/agenda-event.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, rescheduleAgendaEventRequestSchema)

  const event = await agendaContainer.rescheduleAgendaEventUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    id: (await context.params).id,
    inicio: body.start,
    durationMinutes: body.durationMinutes,
  })

  return NextResponse.json({ event: toAgendaEventResponse(event) }, { status: 200 })
})
