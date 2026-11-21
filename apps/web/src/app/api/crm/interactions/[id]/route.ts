import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { completeInteractionSchema } from '@server/crm/schemas/interaction.schema'
import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const PATCH = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, crmIdParamsSchema)
  const body = await parseJsonBody(request, completeInteractionSchema)
  const interaction = await crmContainer.completeInteractionUseCase.execute({
    actorId: actor.sub,
    actorRole: actor.role,
    actorTenantId: actor.tenantId,
    interactionId: id,
    ...body,
  })
  return NextResponse.json({ interaction })
})
