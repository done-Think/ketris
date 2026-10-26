import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const activities = await maintenanceContainer.listMaintenanceTicketActivitiesUseCase.execute({
      ...actor,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
    })
    return NextResponse.json({ activities })
  },
)
