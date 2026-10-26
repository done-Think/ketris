import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { maintenanceContainer } from '@server/maintenance/container'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceMediaParamsSchema } from '@server/maintenance/schemas/maintenance-ticket-input.schema'
import type { MaintenanceMediaRouteContext } from '@server/maintenance/types/route-context'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

// Session cookies are accepted here (allowSession) because the files are loaded by <img> tags.
export const GET = withErrorHandling(
  async (request: NextRequest, context: MaintenanceMediaRouteContext) => {
    const actor = await requireMaintenanceActor(request, true)
    const { key } = await parseRouteParams(context.params, maintenanceMediaParamsSchema)
    const file = await maintenanceContainer.getMaintenanceAttachmentUseCase.execute({
      ...actor,
      keyParts: key,
    })

    if (!file) return new NextResponse(null, { status: 404 })

    return new NextResponse(Buffer.from(file.body), {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  },
)
