import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toAuthenticatedPlatformAdminResponse } from '@server/platform/domain/platform-admin.entity'
import {
  PLATFORM_MANAGER_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { updatePlatformAdminRequestSchema } from '@server/platform/schemas/update-platform-admin.schema'
import type { PlatformIdRouteContext } from '@server/platform/types/http'
import { platformIdParamsSchema } from '@server/platform/schemas/route-params.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    await requirePlatformBearerAuth(request, platformContainer.tokenService)
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)

    const admin = await platformContainer.getPlatformAdminUseCase.execute({
      platformAdminId: id,
    })

    return NextResponse.json(
      { admin: toAuthenticatedPlatformAdminResponse(admin) },
      { status: 200 },
    )
  },
)

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    const actor = await requirePlatformAdminRole(
      request,
      platformContainer.tokenService,
      platformContainer.platformAdminRepository,
      PLATFORM_MANAGER_ROLES,
    )
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)
    const body = await parseJsonBody(request, updatePlatformAdminRequestSchema)

    const admin = await platformContainer.updatePlatformAdminUseCase.execute({
      actorId: actor.id,
      platformAdminId: id,
      name: body.name,
      email: body.email,
      role: body.role,
      active: body.active,
    })

    return NextResponse.json(
      { admin: toAuthenticatedPlatformAdminResponse(admin) },
      { status: 200 },
    )
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    const actor = await requirePlatformAdminRole(
      request,
      platformContainer.tokenService,
      platformContainer.platformAdminRepository,
      PLATFORM_MANAGER_ROLES,
    )
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)

    const admin = await platformContainer.deactivatePlatformAdminUseCase.execute({
      actorId: actor.id,
      platformAdminId: id,
    })

    return NextResponse.json(
      { admin: toAuthenticatedPlatformAdminResponse(admin) },
      { status: 200 },
    )
  },
)
