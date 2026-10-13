import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const actorUser = await authContainer.userRepository.findById(actor.sub)

  const ticket = await maintenanceContainer.resolveMaintenanceTicketUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorName: actorUser?.nome ?? '',
    ticketId: (await context.params).id,
  })

  return NextResponse.json({ ticket }, { status: 200 })
})
