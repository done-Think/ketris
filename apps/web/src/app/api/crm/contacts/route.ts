import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import {
  createContactRequestSchema,
  listContactsQuerySchema,
} from '@server/crm/schemas/contact.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const filters = parseQuery(request, listContactsQuerySchema)

  const page = await crmContainer.listContactsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    filters,
  })

  return NextResponse.json(
    { contacts: page.items, pagination: page.pagination, groups: page.groups },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createContactRequestSchema)

  const contact = await crmContainer.createContactUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    actorId: actor.sub,
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    type: body.type ?? 'LOCATARIO',
    avatarUrl: body.avatarUrl ?? null,
    notes: body.notes ?? null,
  })

  return NextResponse.json({ contact }, { status: 201 })
})
