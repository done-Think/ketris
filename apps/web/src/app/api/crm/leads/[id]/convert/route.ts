import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { convertLeadRequestSchema } from '@server/crm/schemas/lead.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, convertLeadRequestSchema)

  const { lead, opportunity } = await crmContainer.convertLeadToOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    leadId: (await context.params).id,
    propertyId: body.propertyId,
    proposedValue: body.proposedValue,
  })

  return NextResponse.json({ lead, opportunityId: opportunity.id }, { status: 200 })
})
