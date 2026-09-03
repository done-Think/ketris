import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import {
  createContactRequestSchema,
  listContactsQuerySchema,
} from '@server/crm/schemas/contact.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const parsed = listContactsQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const contacts = await crmContainer.listContactsUseCase.execute({
    actorTenantId: actor.tenantId,
    filters: {
      type: parsed.data.type,
      q: parsed.data.q,
      includeArchived: parsed.data.includeArchived,
    },
  })

  return NextResponse.json({ contacts }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createContactRequestSchema)

  const contact = await crmContainer.createContactUseCase.execute({
    actorTenantId: actor.tenantId,
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    type: body.type ?? 'LOCATARIO',
    avatarUrl: body.avatarUrl ?? null,
    notes: body.notes ?? null,
  })

  return NextResponse.json({ contact }, { status: 201 })
})
