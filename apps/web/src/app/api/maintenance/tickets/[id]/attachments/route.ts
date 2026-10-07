import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw new RequestValidationError([{ path: 'file', message: 'Envie um arquivo em "file".' }])
  }

  const body = Buffer.from(await file.arrayBuffer())
  const actorUser = await authContainer.userRepository.findById(actor.sub)

  const attachment = await maintenanceContainer.uploadMaintenanceTicketAttachmentUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorName: actorUser?.nome ?? '',
    ticketId: (await context.params).id,
    filename: file.name,
    contentType: file.type,
    body,
  })

  return NextResponse.json({ attachment }, { status: 201 })
})
