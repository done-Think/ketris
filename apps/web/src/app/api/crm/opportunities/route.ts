import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import {
  createOpportunityRequestSchema,
  listOpportunitiesQuerySchema,
} from '@server/crm/schemas/opportunity.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const filters = parseQuery(request, listOpportunitiesQuerySchema)

  const page = await crmContainer.listOpportunitiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    filters,
  })

  return NextResponse.json(
    { opportunities: page.items, pagination: page.pagination, groups: page.groups },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createOpportunityRequestSchema)

  const opportunity = await crmContainer.createOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    propertyId: body.propertyId,
    responsibleId: body.responsibleId,
    contactId: body.contactId,
    leadName: body.leadName,
    leadEmail: body.leadEmail,
    leadPhone: body.leadPhone,
    proposedValue: body.proposedValue,
    contractTermMonths: body.contractTermMonths,
    desiredStartDate: body.desiredStartDate,
    guaranteeType: body.guaranteeType,
    specialConditions: body.specialConditions,
    notes: body.notes,
    status: body.status,
  })

  return NextResponse.json({ opportunity }, { status: 201 })
})
