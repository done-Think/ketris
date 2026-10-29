import { validationIssue } from '@server/shared/http/validation-messages'
import { maintenanceAttachmentFormSchema } from '@server/maintenance/schemas/maintenance-attachment.schema'
import { maintenanceTicketIdParamsSchema } from '@server/maintenance/schemas/maintenance-ticket.schema'
import type { MaintenanceTicketRouteContext } from '@server/maintenance/types/route-context'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: MaintenanceTicketRouteContext) => {
    const actor = await requireMaintenanceActor(request)
    const formData = await request.formData()
    const parsed = maintenanceAttachmentFormSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success || formData.getAll('file').length !== 1)
      throw new RequestValidationError([validationIssue('file', 'singleFileRequired')])
    const file = parsed.data.file

    const body = Buffer.from(await file.arrayBuffer())

    const attachment = await maintenanceContainer.uploadMaintenanceTicketAttachmentUseCase.execute({
      ...actor,
      ticketId: (await parseRouteParams(context.params, maintenanceTicketIdParamsSchema)).id,
      filename: file.name,
      contentType: file.type,
      body,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  },
)
