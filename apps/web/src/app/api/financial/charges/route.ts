import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import {
  createChargeRequestSchema,
  listChargesQuerySchema,
} from '@server/financial/schemas/charge-input.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const parsed = listChargesQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const result = await financialContainer.listChargesUseCase.execute({
    tenantId: actor.tenantId,
    type: parsed.data.type,
    status: parsed.data.status,
    search: parsed.data.search,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  })

  return NextResponse.json(result, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createChargeRequestSchema)

  const charge = await financialContainer.createChargeUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    contractId: body.contractId ?? null,
    description: body.description ?? null,
    type: body.type,
    amount: body.amount,
    dueDate: body.dueDate,
    status: body.status,
  })

  return NextResponse.json({ charge }, { status: 201 })
})
