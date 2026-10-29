import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { assignOpportunityResponsibleRequestSchema } from '@server/crm/schemas/opportunity.schema'
import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const PUT = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, crmIdParamsSchema)
  const body = await parseJsonBody(request, assignOpportunityResponsibleRequestSchema)

  const opportunity = await crmContainer.assignOpportunityResponsibleUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    opportunityId: id,
    responsibleId: body.responsibleId,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})
