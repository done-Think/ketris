import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { updatePlatformAdminRequestSchema } from '@server/platform/schemas/update-platform-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const admin = await platformContainer.getPlatformAdminUseCase.execute({
    platformAdminId: context.params.id,
  })

  return NextResponse.json({ admin }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, updatePlatformAdminRequestSchema)

  const admin = await platformContainer.updatePlatformAdminUseCase.execute({
    platformAdminId: context.params.id,
    nome: body.nome,
    email: body.email,
  })

  return NextResponse.json({ admin }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const admin = await platformContainer.deactivatePlatformAdminUseCase.execute({
    actorId: actor.sub,
    platformAdminId: context.params.id,
  })

  return NextResponse.json({ admin }, { status: 200 })
})
