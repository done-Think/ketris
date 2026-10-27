import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { resolveMaintenanceTicketRequestSchema } from '@server/maintenance/schemas/maintenance-attachment.schema'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    if (request.body) await parseJsonBody(request, resolveMaintenanceTicketRequestSchema)
    const ticket = await maintenanceContainer.resolveMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
    })
    return NextResponse.json({ ticket: ticket })
  },
)
