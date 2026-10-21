import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { publicTicket } from '@server/maintenance/application/authorization'
import { updateMaintenanceTicketRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const ticket = await maintenanceContainer.getMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await context.params).id,
    })
    return NextResponse.json({ ticket: publicTicket(ticket, actor) })
  },
)
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const body = await parseJsonBody(request, updateMaintenanceTicketRequestSchema)
    const ticket = await maintenanceContainer.updateMaintenanceTicketUseCase.execute({
      ...actor,
      ...body,
      ticketId: (await context.params).id,
    })
    return NextResponse.json({ ticket: publicTicket(ticket, actor) })
  },
)
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    await maintenanceContainer.deleteMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await context.params).id,
    })
    return new NextResponse(null, { status: 204 })
  },
)
