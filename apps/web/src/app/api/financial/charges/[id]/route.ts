import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { updateChargeRequestSchema } from '@server/financial/schemas/charge-input.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const charge = await financialContainer.getChargeUseCase.execute({
    actorTenantId: actor.tenantId,
    chargeId: (await context.params).id,
  })

  return NextResponse.json({ charge }, { status: 200 })
})

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, updateChargeRequestSchema)

  const charge = await financialContainer.updateChargeUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    chargeId: (await context.params).id,
    description: body.description ?? null,
    type: body.type,
    amount: body.amount,
    dueDate: body.dueDate,
    status: body.status,
  })

  return NextResponse.json({ charge }, { status: 200 })
})
