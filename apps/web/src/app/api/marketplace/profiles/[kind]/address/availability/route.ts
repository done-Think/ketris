import { NextResponse, type NextRequest } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import {
  profileAddressAvailabilityQuerySchema,
  profileAddressParamsSchema,
} from '@server/marketplace/schemas/profile-address.schema'
import type { ProfileAddressRouteContext } from '@server/marketplace/types/profile-address'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ProfileAddressRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { kind } = profileAddressParamsSchema.parse(await context.params)
    const { handle } = profileAddressAvailabilityQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    )
    const result = await marketplaceContainer.profileAddressUseCase.isAvailable({
      kind,
      handle,
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  },
)
