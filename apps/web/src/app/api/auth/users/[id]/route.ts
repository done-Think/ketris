import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { userIdParamsSchema } from '@server/auth/schemas/user-params.schema'
import type { UserRouteContext } from '@server/auth/types/route-context'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { updateUserRequestSchema } from '@server/auth/schemas/update-user.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: UserRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, userIdParamsSchema)

  const user = await authContainer.getUserUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    userId: id,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: UserRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, userIdParamsSchema)
  const body = await parseJsonBody(request, updateUserRequestSchema)

  const user = await authContainer.updateUserUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    userId: id,
    nome: body.name,
    email: body.email,
    avatarUrl: body.avatarUrl,
    telefone: body.phone,
    creci: body.creci,
    papel: body.role,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: UserRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, userIdParamsSchema)

  const user = await authContainer.deactivateUserUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    userId: id,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 200 })
})
