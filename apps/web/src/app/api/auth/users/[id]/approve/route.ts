import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse, type Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const user = await authContainer.approveUserMembershipUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    userId: (await context.params).id,
  })

  return NextResponse.json({ user: toAuthenticatedUserResponse(user) }, { status: 200 })
})
