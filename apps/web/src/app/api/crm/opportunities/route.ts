import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import {
  createOpportunityRequestSchema,
  listOpportunitiesQuerySchema,
} from '@server/crm/schemas/opportunity.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const parsed = listOpportunitiesQuerySchema.safeParse(
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

  const opportunities = await crmContainer.listOpportunitiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    filters: {
      status: parsed.data.status,
      contactId: parsed.data.contactId,
      includeArchived: parsed.data.includeArchived,
    },
  })

  return NextResponse.json({ opportunities }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createOpportunityRequestSchema)

  const opportunity = await crmContainer.createOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
    propertyId: body.propertyId,
    contactId: body.contactId,
    leadName: body.leadName,
    leadEmail: body.leadEmail,
    leadPhone: body.leadPhone,
    proposedValue: body.proposedValue,
    notes: body.notes,
    status: body.status,
  })

  return NextResponse.json({ opportunity }, { status: 201 })
})
