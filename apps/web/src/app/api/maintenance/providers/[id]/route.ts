import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { updateMaintenanceProviderRequestSchema } from '@server/maintenance/schemas/maintenance-provider.schema'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    const changes = await parseJsonBody(request, updateMaintenanceProviderRequestSchema)
    const provider = await maintenanceContainer.updateMaintenanceProviderUseCase.execute({
      ...actor,
      providerId: id,
      changes,
    })
    return NextResponse.json({ provider })
  },
)
