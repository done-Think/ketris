import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import type { PlatformIdRouteContext } from '@server/platform/types/http'
import { platformIdParamsSchema } from '@server/platform/schemas/route-params.schema'
import { listTenantUsersQuerySchema } from '@server/platform/schemas/list-tenant-users.schema'
import { parseQuery, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    await requirePlatformBearerAuth(request, platformContainer.tokenService)
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)

    const page = parseQuery(request, listTenantUsersQuerySchema)
    const { items, ...meta } = await platformContainer.listTenantUsersUseCase.execute({
      tenantId: id,
      ...page,
    })

    return NextResponse.json(
      { users: items.map(toAuthenticatedUserResponse), ...meta },
      { status: 200 },
    )
  },
)
