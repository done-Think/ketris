import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const activities = await maintenanceContainer.listMaintenanceTicketActivitiesUseCase.execute({
    actorTenantId: actor.tenantId,
    ticketId: (await context.params).id,
  })

  return NextResponse.json({ activities }, { status: 200 })
})
