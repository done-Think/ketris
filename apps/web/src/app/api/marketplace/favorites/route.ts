import { NextResponse, type NextRequest } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const favorites = await marketplaceContainer.favoritePropertiesUseCase.list({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
  })
  return NextResponse.json(favorites, { headers: { 'Cache-Control': 'no-store' } })
})
