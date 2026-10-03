import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { registerChargePaymentRequestSchema } from '@server/financial/schemas/charge-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, registerChargePaymentRequestSchema)

  const charge = await financialContainer.registerChargePaymentUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    chargeId: (await context.params).id,
    paidAt: body.paidAt,
    paymentMethod: body.paymentMethod,
    receiptUrl: body.receiptUrl ?? null,
  })

  return NextResponse.json({ charge }, { status: 200 })
})
