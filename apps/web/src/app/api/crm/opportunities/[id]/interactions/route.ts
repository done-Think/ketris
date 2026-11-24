import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { interactionQuerySchema } from '@server/crm/schemas/interaction.schema'
import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseQuery, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, crmIdParamsSchema)
  const query = parseQuery(request, interactionQuerySchema)
  const page = await crmContainer.listInteractionsUseCase.execute({
    actorId: actor.sub,
    actorRole: actor.role,
    actorTenantId: actor.tenantId,
    target: { kind: 'opportunity', id },
    ...query,
  })
  return NextResponse.json(page)
})
