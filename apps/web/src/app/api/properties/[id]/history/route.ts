import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { propertyIdParamsSchema } from '@server/properties/schemas/property.schema'
import { propertyHistoryQuerySchema } from '@server/properties/schemas/property-history.schema'
import type { PropertyRouteContext } from '@server/properties/types/http'
import { parseQuery, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: PropertyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const params = await parseRouteParams(context.params, propertyIdParamsSchema)
    const query = parseQuery(request, propertyHistoryQuerySchema)
    return NextResponse.json(
      await propertiesContainer.readPropertyHistoryUseCase.execute({
        ...params,
        ...query,
        actorTenantId: actor.tenantId,
        actorId: actor.sub,
        actorRole: actor.role,
      }),
    )
  },
)
