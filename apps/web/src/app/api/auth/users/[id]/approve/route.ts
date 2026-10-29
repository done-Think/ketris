import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { userIdParamsSchema } from '@server/auth/schemas/user-params.schema'
import type { UserRouteContext } from '@server/auth/types/route-context'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const PATCH = withErrorHandling(async (request: NextRequest, context: UserRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, userIdParamsSchema)

  const user = await authContainer.approveUserMembershipUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorRole: actor.role,
    userId: id,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 200 })
})
