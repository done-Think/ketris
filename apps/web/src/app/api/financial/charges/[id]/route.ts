import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { toChargeResponse } from '@server/financial/application/charge-response'
import { updateChargeRequestSchema } from '@server/financial/schemas/charge-input.schema'
import { chargeIdParamsSchema } from '@server/financial/schemas/charge.schema'
import type { ChargeRouteContext } from '@server/financial/types/http'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: ChargeRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)

  const charge = await financialContainer.getChargeUseCase.execute({
    actorId: actor.sub,
    actorPapel: actor.papel,
    actorTenantId: actor.tenantId,
    chargeId: id,
  })

  return NextResponse.json({ charge: toChargeResponse(charge) }, { status: 200 })
})

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: ChargeRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)
    const body = await parseJsonBody(request, updateChargeRequestSchema)

    const charge = await financialContainer.updateChargeUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel,
      chargeId: id,
      ...body,
    })

    return NextResponse.json({ charge: toChargeResponse(charge) }, { status: 200 })
  },
)

export const DELETE = withErrorHandling(
  async (request: NextRequest, context: ChargeRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)

    await financialContainer.deleteChargeUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel,
      chargeId: id,
    })

    return new NextResponse(null, { status: 204 })
  },
)
