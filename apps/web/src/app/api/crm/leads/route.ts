import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { createLeadRequestSchema } from '@server/crm/schemas/lead.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const leads = await crmContainer.listLeadsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ leads }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createLeadRequestSchema)

  const lead = await crmContainer.createLeadUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
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
