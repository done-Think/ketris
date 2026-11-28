import { NextResponse, type NextRequest } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { favoritePropertyParamsSchema } from '@server/marketplace/schemas/favorite-property.schema'
import type { FavoritePropertyRouteContext } from '@server/marketplace/types/favorite-property'
import { withErrorHandling } from '@server/shared/http'

async function resolveFavoriteInput(request: NextRequest, context: FavoritePropertyRouteContext) {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { propertyId } = favoritePropertyParamsSchema.parse(await context.params)
  return { actorId: actor.sub, actorTenantId: actor.tenantId, propertyId }
}

export const PUT = withErrorHandling(
  async (request: NextRequest, context: FavoritePropertyRouteContext) => {
    const saved = await marketplaceContainer.favoritePropertiesUseCase.save(
      await resolveFavoriteInput(request, context),
    )
    return NextResponse.json(saved, { headers: { 'Cache-Control': 'no-store' } })
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: FavoritePropertyRouteContext) => {
    await marketplaceContainer.favoritePropertiesUseCase.remove(
      await resolveFavoriteInput(request, context),
    )
    return new NextResponse(null, { status: 204 })
  },
)
