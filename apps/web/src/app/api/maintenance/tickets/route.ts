import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import {
  createMaintenanceTicketRequestSchema,
  listMaintenanceTicketsQuerySchema,
} from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const query = parseQuery(request, listMaintenanceTicketsQuerySchema)
  const result = await maintenanceContainer.listMaintenanceTicketsUseCase.execute({
    ...query,
    tenantId: actor.actorTenantId,
    actor,
  })

  return NextResponse.json(result)
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const body = await parseJsonBody(request, createMaintenanceTicketRequestSchema)
  const ticket = await maintenanceContainer.createMaintenanceTicketUseCase.execute({
    ...actor,
    ...body,
  })

  return NextResponse.json({ ticket }, { status: 201 })
})
