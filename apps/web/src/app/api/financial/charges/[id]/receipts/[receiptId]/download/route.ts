import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { chargeReceiptParamsSchema } from '@server/financial/schemas/charge.schema'
import type { ChargeReceiptRouteContext } from '@server/financial/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ChargeReceiptRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id, receiptId } = await parseRouteParams(context.params, chargeReceiptParamsSchema)

    const download = await financialContainer.downloadChargeReceiptUseCase.execute({
      actorId: actor.sub,
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel,
      chargeId: id,
      receiptId,
    })

    return NextResponse.json(
      { url: download.url, expiresAt: download.expiresAt.toISOString() },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  },
)
