import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import { updateMaintenanceTicketRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const ticket = await maintenanceContainer.getMaintenanceTicketUseCase.execute({
    actorTenantId: actor.tenantId,
    ticketId: (await context.params).id,
  })

  return NextResponse.json({ ticket }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updateMaintenanceTicketRequestSchema)

  const ticket = await maintenanceContainer.updateMaintenanceTicketUseCase.execute({
    actorTenantId: actor.tenantId,
    ticketId: (await context.params).id,
    propertyId: body.propertyId,
    category: body.category,
    priority: body.priority,
    title: body.title,
    description: body.description,
  })

  return NextResponse.json({ ticket }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  await maintenanceContainer.deleteMaintenanceTicketUseCase.execute({
    actorTenantId: actor.tenantId,
    ticketId: (await context.params).id,
  })

  return new NextResponse(null, { status: 204 })
})
