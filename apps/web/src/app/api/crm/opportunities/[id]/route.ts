import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import type { OpportunityUpdate } from '@server/crm/domain/opportunity.entity'
import {
  deleteOpportunityQuerySchema,
  patchOpportunityRequestSchema,
  putOpportunityRequestSchema,
} from '@server/crm/schemas/opportunity.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const opportunity = await crmContainer.getOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    opportunityId: (await context.params).id,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})

export const PUT = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, putOpportunityRequestSchema)

  const changes: OpportunityUpdate = {
    contactId: body.contactId ?? null,
    leadName: body.leadName,
    leadEmail: body.leadEmail,
    leadPhone: body.leadPhone ?? null,
    proposedValue: body.proposedValue,
    contractTermMonths: body.contractTermMonths ?? null,
    desiredStartDate: body.desiredStartDate ?? null,
    guaranteeType: body.guaranteeType ?? 'NENHUMA',
    specialConditions: body.specialConditions ?? [],
    notes: body.notes ?? null,
    status: body.status,
  }

  const opportunity = await crmContainer.updateOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    opportunityId: (await context.params).id,
    changes,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, patchOpportunityRequestSchema)

  const opportunity = await crmContainer.updateOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    opportunityId: (await context.params).id,
    changes: body,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})

export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const parsed = deleteOpportunityQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  if (parsed.data.permanent) {
    await crmContainer.deleteOpportunityUseCase.execute({
      actorTenantId: actor.tenantId,
      opportunityId: (await context.params).id,
    })

    return new NextResponse(null, { status: 204 })
  }

  const opportunity = await crmContainer.archiveOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    opportunityId: (await context.params).id,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})
