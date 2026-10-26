import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { crmPropertyQuerySchema } from '@server/crm/schemas/property.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const page = await crmContainer.listCrmPropertiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    filters: parseQuery(request, crmPropertyQuerySchema),
  })
  return NextResponse.json(page)
})
