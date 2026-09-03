import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { createActivityRequestSchema } from '@server/crm/schemas/activity.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const activities = await crmContainer.listOpportunityActivitiesUseCase.execute({
    actorTenantId: actor.tenantId,
    opportunityId: (await context.params).id,
  })

  return NextResponse.json({ activities }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createActivityRequestSchema)

  const activity = await crmContainer.addOpportunityNoteUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    opportunityId: (await context.params).id,
    description: body.description,
    type: body.type,
  })

  return NextResponse.json({ activity }, { status: 201 })
})
