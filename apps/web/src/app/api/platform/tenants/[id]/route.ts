import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { platformIdParamsSchema } from '@server/platform/schemas/route-params.schema'
import type { PlatformIdRouteContext } from '@server/platform/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    await requirePlatformBearerAuth(request, platformContainer.tokenService)
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)
    const tenant = await platformContainer.getPlatformTenantUseCase.execute(id)

    return NextResponse.json({ tenant: toPlatformTenantResponse(tenant) }, { status: 200 })
  },
)
