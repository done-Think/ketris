import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceLinksSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  const input = await parseJsonBody(request, maintenanceLinksSchema)
  await maintenanceContainer.regularizeMaintenanceLinksUseCase.execute({ ...actor, links: input })
  return new NextResponse(null, { status: 204 })
})
