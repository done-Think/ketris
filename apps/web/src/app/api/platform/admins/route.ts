import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toAuthenticatedPlatformAdminResponse } from '@server/platform/domain/platform-admin.entity'
import {
  PLATFORM_MANAGER_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createPlatformAdminRequestSchema } from '@server/platform/schemas/create-platform-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requirePlatformAdminRole(
    request,
    platformContainer.tokenService,
    platformContainer.platformAdminRepository,
    PLATFORM_MANAGER_ROLES,
  )
  const body = await parseJsonBody(request, createPlatformAdminRequestSchema)

  const admin = await platformContainer.createPlatformAdminUseCase.execute({
    actorId: actor.id,
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
  })

  return NextResponse.json({ admin: toAuthenticatedPlatformAdminResponse(admin) }, { status: 201 })
})

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const admins = await platformContainer.listPlatformAdminsUseCase.execute()

  return NextResponse.json(
    { admins: admins.map(toAuthenticatedPlatformAdminResponse) },
    { status: 200 },
  )
})
