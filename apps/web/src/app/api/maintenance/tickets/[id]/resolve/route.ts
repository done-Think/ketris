import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { publicTicket } from '@server/maintenance/application/authorization'
import { withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const ticket = await maintenanceContainer.resolveMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: (await context.params).id,
    })
    return NextResponse.json({ ticket: publicTicket(ticket, actor) })
  },
)
