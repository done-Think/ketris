import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { platformContainer } from '@server/platform/container'
import {
  PLATFORM_MANAGER_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { createTenantAdminRequestSchema } from '@server/platform/schemas/create-tenant-admin.schema'
import type { PlatformIdRouteContext } from '@server/platform/types/http'
import { platformIdParamsSchema } from '@server/platform/schemas/route-params.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    const actor = await requirePlatformAdminRole(
      request,
      platformContainer.tokenService,
      platformContainer.platformAdminRepository,
      PLATFORM_MANAGER_ROLES,
    )
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)
    const body = await parseJsonBody(request, createTenantAdminRequestSchema)

    const user = await platformContainer.createTenantAdminUseCase.execute({
      actorId: actor.id,
      tenantId: id,
      nome: body.name,
      email: body.email,
      password: body.password,
    })

    return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 201 })
  },
)
