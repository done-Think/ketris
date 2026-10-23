import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { publicTicket } from '@server/maintenance/application/authorization'
import {
  createMaintenanceTicketRequestSchema,
  listMaintenanceTicketsQuerySchema,
} from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const parsed = listMaintenanceTicketsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )
  if (!parsed.success)
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    )
  const result = await maintenanceContainer.listMaintenanceTicketsUseCase.execute({
    ...parsed.data,
    tenantId: actor.actorTenantId,
    actor,
  })
  return NextResponse.json(result)
})
export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const body = await parseJsonBody(request, createMaintenanceTicketRequestSchema)
  const ticket = await maintenanceContainer.createMaintenanceTicketUseCase.execute({
    ...actor,
    ...body,
  })
  return NextResponse.json({ ticket: publicTicket(ticket, actor) }, { status: 201 })
})
