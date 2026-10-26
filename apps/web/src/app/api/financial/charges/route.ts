import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import {
  toChargeListResponse,
  toChargeResponse,
} from '@server/financial/application/charge-response'
import {
  createChargeRequestSchema,
  listChargesQuerySchema,
} from '@server/financial/schemas/charge-input.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listChargesQuerySchema)

  const result = await financialContainer.listChargesUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    ...query,
  })

  return NextResponse.json(toChargeListResponse(result), { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createChargeRequestSchema)

  const charge = await financialContainer.createChargeUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    contractId: body.contractId ?? null,
    description: body.description ?? null,
    type: body.type,
    amount: body.amount,
    dueDate: body.dueDate,
    status: body.status,
  })

  return NextResponse.json({ charge: toChargeResponse(charge) }, { status: 201 })
})
