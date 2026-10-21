import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { publicTicket } from '@server/maintenance/application/authorization'
import { actOnTicket } from '@server/maintenance/application/workflow'
import { maintenanceActionSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const action = await parseJsonBody(request, maintenanceActionSchema)
    const ticket = await actOnTicket(
      maintenanceContainer.repository,
      actor,
      (await context.params).id,
      action,
    )
    return NextResponse.json({ ticket: publicTicket(ticket, actor) })
  },
)
