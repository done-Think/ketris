import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import type { MaintenanceMediaRouteContext } from '@server/maintenance/types/route-context'
import { withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceMediaRouteContext) => {
    const actor = await requireMaintenanceActor(request, true)
    const object = await maintenanceContainer.getMaintenanceAttachmentUseCase.execute({
      ...actor,
      key: (await context.params).key,
    })
    if (!object) return new NextResponse(null, { status: 404 })

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: object.url,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  },
)
