import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { toChargeResponse } from '@server/financial/application/charge-response'
import { chargeReasonRequestSchema } from '@server/financial/schemas/charge-input.schema'
import { chargeIdParamsSchema } from '@server/financial/schemas/charge.schema'
import type { ChargeRouteContext } from '@server/financial/types/http'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: ChargeRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)
  const body = await parseJsonBody(request, chargeReasonRequestSchema)

  const charge = await financialContainer.reverseChargePaymentUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    chargeId: id,
    reason: body.reason,
  })

  return NextResponse.json({ charge: toChargeResponse(charge) }, { status: 200 })
})
