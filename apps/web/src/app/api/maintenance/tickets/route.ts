import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { maintenanceContainer } from '@server/maintenance/container'
import {
  createMaintenanceTicketRequestSchema,
  listMaintenanceTicketsQuerySchema,
} from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const parsed = listMaintenanceTicketsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const result = await maintenanceContainer.listMaintenanceTicketsUseCase.execute({
    tenantId: actor.tenantId,
    status: parsed.data.status,
    propertyId: parsed.data.propertyId,
    search: parsed.data.search,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  })

  return NextResponse.json(result, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createMaintenanceTicketRequestSchema)
  const actorUser = await authContainer.userRepository.findById(actor.sub)

  const ticket = await maintenanceContainer.createMaintenanceTicketUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorName: actorUser?.nome ?? '',
    propertyId: body.propertyId,
    category: body.category,
    priority: body.priority,
    title: body.title,
    description: body.description,
  })

  return NextResponse.json({ ticket }, { status: 201 })
})
