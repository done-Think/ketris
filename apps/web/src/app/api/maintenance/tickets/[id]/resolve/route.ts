import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    const ticket = await maintenanceContainer.resolveMaintenanceTicketUseCase.execute({
      ...actor,
      ticketId: id,
    })

    return NextResponse.json({ ticket })
  },
)
