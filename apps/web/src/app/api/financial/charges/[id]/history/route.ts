import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { toChargeHistoryResponse } from '@server/financial/application/charge-response'
import { chargeIdParamsSchema } from '@server/financial/schemas/charge.schema'
import type { ChargeRouteContext } from '@server/financial/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest, context: ChargeRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)

  const events = await financialContainer.listChargeHistoryUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    chargeId: id,
  })

  return NextResponse.json(toChargeHistoryResponse(events), { status: 200 })
})
