import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { createLeadRequestSchema, listLeadsQuerySchema } from '@server/crm/schemas/lead.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const page = await crmContainer.listLeadsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    filters: parseQuery(request, listLeadsQuerySchema),
  })

  return NextResponse.json(
    { leads: page.items, pagination: page.pagination, groups: page.groups },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createLeadRequestSchema)

  const lead = await crmContainer.createLeadUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    name: body.name,
    phone: body.phone,
    email: body.email ?? null,
    interest: body.interest,
    budget: body.budget,
    source: body.source,
    notes: body.notes ?? null,
  })

  return NextResponse.json({ lead }, { status: 201 })
})
