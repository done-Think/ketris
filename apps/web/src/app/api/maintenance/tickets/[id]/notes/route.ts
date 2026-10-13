import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import { addMaintenanceTicketNoteRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, addMaintenanceTicketNoteRequestSchema)
  const actorUser = await authContainer.userRepository.findById(actor.sub)

  const activity = await maintenanceContainer.addMaintenanceTicketNoteUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorName: actorUser?.nome ?? '',
    ticketId: (await context.params).id,
    message: body.message,
  })

  return NextResponse.json({ activity }, { status: 201 })
})
