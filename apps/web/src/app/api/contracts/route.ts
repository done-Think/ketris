import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import {
  createContractRequestSchema,
  listContractsQuerySchema,
} from '@server/contracts/schemas/contract-input.schema'
import { parseJsonBody, RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const parsed = listContractsQuerySchema.safeParse(
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

  const result = await contractsContainer.listContractsUseCase.execute({
    tenantId: actor.tenantId,
    status: parsed.data.status,
    type: parsed.data.type,
    propertyId: parsed.data.propertyId,
    search: parsed.data.search,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  })

  return NextResponse.json(result, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createContractRequestSchema)

  const contract = await contractsContainer.createContractFromOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    opportunityId: body.opportunityId,
    type: body.type,
    dueDay: body.dueDay,
    startDate: body.startDate,
    endDate: body.endDate,
    adjustmentIndex: body.adjustmentIndex,
    guaranteeType: body.guaranteeType,
    notes: body.notes ?? null,
    owner: { ...body.owner, phone: body.owner.phone ?? null },
    tenant: { ...body.tenant, phone: body.tenant.phone ?? null },
    guarantor: body.guarantor ? { ...body.guarantor, phone: body.guarantor.phone ?? null } : null,
  })

  return NextResponse.json({ contract }, { status: 201 })
})
