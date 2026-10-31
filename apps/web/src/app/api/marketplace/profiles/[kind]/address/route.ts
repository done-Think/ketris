import { NextResponse, type NextRequest } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import {
  profileAddressParamsSchema,
  saveProfileAddressSchema,
} from '@server/marketplace/schemas/profile-address.schema'
import { PublicProfileAddressTakenError } from '@server/marketplace/domain/profile-address-errors'
import type { ProfileAddressRouteContext } from '@server/marketplace/types/profile-address'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import { resolveRequestLocale } from '@server/shared/http/request-locale'
import { validationMessage } from '@server/shared/http/validation-messages'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ProfileAddressRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { kind } = profileAddressParamsSchema.parse(await context.params)
    const address = await marketplaceContainer.profileAddressUseCase.getOwn({
      kind,
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorRole: actor.role,
    })
    return NextResponse.json(address, { headers: { 'Cache-Control': 'no-store' } })
  },
)

export const PUT = withErrorHandling(
  async (request: NextRequest, context: ProfileAddressRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { kind } = profileAddressParamsSchema.parse(await context.params)
    const { handle } = await parseJsonBody(request, saveProfileAddressSchema)
    try {
      const address = await marketplaceContainer.profileAddressUseCase.save({
        kind,
        handle,
        actorId: actor.sub,
        actorTenantId: actor.tenantId,
        actorRole: actor.role,
      })
      return NextResponse.json(address, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      if (!(error instanceof PublicProfileAddressTakenError)) throw error
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: validationMessage(resolveRequestLocale(request), 'publicAddressTaken'),
          },
        },
        { status: 409 },
      )
    }
  },
)
