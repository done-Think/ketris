import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import { patchContactRequestSchema } from '@server/crm/schemas/contact.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const contact = await crmContainer.getContactUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    contactId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
  })

  return NextResponse.json({ contact }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, patchContactRequestSchema)

  const contact = await crmContainer.updateContactUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    contactId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
    changes: body,
  })

  return NextResponse.json({ contact }, { status: 200 })
})

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: CrmIdRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)

    const contact = await crmContainer.archiveContactUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorRole: actor.role,
      contactId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
    })

    return NextResponse.json({ contact }, { status: 200 })
  },
)
