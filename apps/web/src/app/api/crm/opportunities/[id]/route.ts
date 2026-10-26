import { crmIdParamsSchema } from '@server/crm/schemas/route.schema'
import type { CrmIdRouteContext } from '@server/crm/types/route'
import { parseRouteParams } from '@server/shared/http'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { crmContainer } from '@server/crm/container'
import {
  deleteOpportunityQuerySchema,
  patchOpportunityRequestSchema,
} from '@server/crm/schemas/opportunity.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const opportunity = await crmContainer.getOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    opportunityId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: CrmIdRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, patchOpportunityRequestSchema)

  const opportunity = await crmContainer.updateOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    opportunityId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
    changes: body,
  })

  return NextResponse.json({ opportunity }, { status: 200 })
})

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: CrmIdRouteContext) => {
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
        actorId: actor.sub,
        actorPapel: actor.papel,
        opportunityId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
      })

      return new NextResponse(null, { status: 204 })
    }

    const opportunity = await crmContainer.archiveOpportunityUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      opportunityId: (await parseRouteParams(context.params, crmIdParamsSchema)).id,
    })

    return NextResponse.json({ opportunity }, { status: 200 })
  },
)
