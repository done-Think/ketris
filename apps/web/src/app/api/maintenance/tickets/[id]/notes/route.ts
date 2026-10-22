import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { addMaintenanceTicketNoteRequestSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const body = await parseJsonBody(request, addMaintenanceTicketNoteRequestSchema)
    const activity = await maintenanceContainer.addMaintenanceTicketNoteUseCase.execute({
      ...actor,
      ticketId: (await context.params).id,
      message: body.message,
    })
    return NextResponse.json({ activity }, { status: 201 })
  },
)
