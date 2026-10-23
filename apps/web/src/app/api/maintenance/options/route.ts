import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireMaintenanceActor(request)
  return NextResponse.json(await maintenanceContainer.repository.options(actor))
})
