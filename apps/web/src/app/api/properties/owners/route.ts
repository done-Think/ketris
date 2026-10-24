import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { propertyOwnersQuerySchema } from '@server/properties/schemas/property-input.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, propertyOwnersQuerySchema)
  const owners = await propertiesContainer.listPropertyOwnersUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    ...query,
  })
  return NextResponse.json(owners)
})
