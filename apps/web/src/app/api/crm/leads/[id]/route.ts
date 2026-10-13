import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { patchLeadRequestSchema } from '@server/crm/schemas/lead.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const lead = await crmContainer.getLeadUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    leadId: (await context.params).id,
  })

  return NextResponse.json({ lead }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, patchLeadRequestSchema)

  const lead = await crmContainer.updateLeadUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    leadId: (await context.params).id,
    changes: body,
  })

  return NextResponse.json({ lead }, { status: 200 })
})
