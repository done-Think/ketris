import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { respondOpportunityRequestSchema } from '@server/crm/schemas/respond-opportunity.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, respondOpportunityRequestSchema)

  const { opportunity, activity } = await crmContainer.respondToOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    opportunityId: (await context.params).id,
    action: body.action,
    message: body.message,
  })

  return NextResponse.json({ opportunity, activity }, { status: 200 })
})
