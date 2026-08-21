import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const property = await propertiesContainer.unpublishPropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    id: context.params.id,
  })

  return NextResponse.json({ property }, { status: 200 })
})
