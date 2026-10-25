import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { requestEmailChangeSchema } from '@server/auth/schemas/email-verification.schema'
import { userIdParamsSchema } from '@server/auth/schemas/user-params.schema'
import type { UserRouteContext } from '@server/auth/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: UserRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, userIdParamsSchema)
  const input = await parseJsonBody(request, requestEmailChangeSchema)
  await authContainer.requestEmailChangeUseCase.execute({
    ...input,
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    targetUserId: id,
  })
  return new NextResponse(null, { status: 204 })
})
