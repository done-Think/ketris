import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { updateMaintenanceTicketRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    const ticket = await maintenanceContainer.getMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: id,
    })

    return NextResponse.json({ ticket })
  },
)

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    const body = await parseJsonBody(request, updateMaintenanceTicketRequestSchema)
    const ticket = await maintenanceContainer.updateMaintenanceTicketUseCase.execute({
      ...actor,
      ...body,
      ticketId: id,
    })

    return NextResponse.json({ ticket })
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    await maintenanceContainer.deleteMaintenanceTicketUseCase.execute({ ...actor, ticketId: id })

    return new NextResponse(null, { status: 204 })
  },
)
