import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import {
  createContractRequestSchema,
  listContractsQuerySchema,
} from '@server/contracts/schemas/contract-input.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listContractsQuerySchema)

  const result = await contractsContainer.listContractsUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    ...query,
  })

  return NextResponse.json(result, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createContractRequestSchema)

  const contract = await contractsContainer.createContractFromOpportunityUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    opportunityId: body.opportunityId,
    amount: body.amount,
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
