import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import { maintenanceCompleteUploadRequestSchema } from '@server/maintenance/schemas/maintenance-upload.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const { id } = await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)
    const body = await parseJsonBody(request, maintenanceCompleteUploadRequestSchema)
    const attachment =
      await maintenanceContainer.completeMaintenanceAttachmentUploadUseCase.execute({
        ...actor,
        ...body,
        ticketId: id,
      })
    return NextResponse.json({ attachment }, { status: 201 })
  },
)
