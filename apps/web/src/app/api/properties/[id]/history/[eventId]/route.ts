import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { propertyHistoryParamsSchema } from '@server/properties/schemas/property-history.schema'
import type { PropertyHistoryRouteContext } from '@server/properties/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PropertyHistoryRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const params = await parseRouteParams(context.params, propertyHistoryParamsSchema)
    return NextResponse.json(
      await propertiesContainer.readPropertyHistoryUseCase.execute({
        ...params,
        actorTenantId: actor.tenantId,
        actorId: actor.sub,
        actorRole: actor.role,
      }),
    )
  },
)
