import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { updateMaintenanceTicketRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const ticket = await maintenanceContainer.getMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
    })
    return NextResponse.json({ ticket: ticket })
  },
)
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const body = await parseJsonBody(request, updateMaintenanceTicketRequestSchema)
    const ticket = await maintenanceContainer.updateMaintenanceTicketUseCase.execute({
      ...actor,
      ...body,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
    })
    return NextResponse.json({ ticket: ticket })
  },
)
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    await maintenanceContainer.deleteMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
    })
    return new NextResponse(null, { status: 204 })
  },
)
