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
import { PublicProfileNotPublishedError } from '@server/marketplace/domain/profile-address-errors'
import { resolveRequestLocale } from '@server/shared/http/request-locale'
import { validationMessage } from '@server/shared/http/validation-messages'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ProfileAddressRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { kind } = profileAddressParamsSchema.parse(await context.params)
    const { handle } = profileAddressAvailabilityQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    )
    try {
      const result = await marketplaceContainer.profileAddressUseCase.isAvailable({
        kind,
        handle,
        actorId: actor.sub,
        actorTenantId: actor.tenantId,
        actorRole: actor.role,
      })
      return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      if (!(error instanceof PublicProfileNotPublishedError)) throw error
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: validationMessage(
              resolveRequestLocale(request),
              'publicAddressPublishRequired',
            ),
          },
        },
        { status: 409 },
      )
    }
  },
)
