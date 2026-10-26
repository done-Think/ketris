import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { initChargeReceiptUploadRequestSchema } from '@server/financial/schemas/charge-receipt.schema'
import { chargeIdParamsSchema } from '@server/financial/schemas/charge.schema'
import type { ChargeRouteContext } from '@server/financial/types/http'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest, context: ChargeRouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id } = await parseRouteParams(context.params, chargeIdParamsSchema)
  const body = await parseJsonBody(request, initChargeReceiptUploadRequestSchema)

  const upload = await financialContainer.initChargeReceiptUploadUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    chargeId: id,
    ...body,
  })

  return NextResponse.json(
    { ...upload, expiresAt: upload.expiresAt.toISOString() },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  )
})
