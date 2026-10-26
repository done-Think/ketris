import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const property = await crmContainer.getCrmPropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    propertyId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
  })
  return NextResponse.json({ property })
})
