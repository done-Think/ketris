import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceContainer } from '@server/maintenance/container'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw new RequestValidationError([{ path: 'file', message: 'Envie um arquivo em "file".' }])
    }

    const body = Buffer.from(await file.arrayBuffer())

    const attachment = await maintenanceContainer.uploadMaintenanceTicketAttachmentUseCase.execute({
      ...actor,
      ticketId: (await context.params).id,
      filename: file.name,
      contentType: file.type,
      body,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  },
)
