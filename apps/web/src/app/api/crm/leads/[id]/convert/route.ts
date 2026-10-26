import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { convertLeadRequestSchema } from '@server/crm/schemas/lead.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, convertLeadRequestSchema)

  const { lead, opportunity } = await crmContainer.convertLeadToOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    leadId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
    propertyId: body.propertyId,
    proposedValue: body.proposedValue,
    email: body.email,
  })

  return NextResponse.json({ lead, opportunityId: opportunity.id }, { status: 200 })
})
