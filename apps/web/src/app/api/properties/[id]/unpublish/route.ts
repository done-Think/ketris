import { propertyIdParamsSchema } from '@server/properties/schemas/property.schema'
import type { PropertyRouteContext } from '@server/properties/types/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: PropertyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, propertyIdParamsSchema)

    const property = await propertiesContainer.unpublishPropertyUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      id,
      actorPapel: actor.papel as Papel,
    })

    return NextResponse.json({ property }, { status: 200 })
  },
)
