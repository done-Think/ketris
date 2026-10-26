import type { ContractRouteContext } from '@server/contracts/types/route-context'
import { contractIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'
import { editContractRequestSchema } from '@server/contracts/schemas/contract-workflow.schema'
import { contractEditData } from '@server/contracts/application/contract-edit-data'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)

    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)

    const contract = await contractsContainer.getContractUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
    })

    return NextResponse.json({ contract }, { status: 200 })
  },
)

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)
    const body = await parseJsonBody(request, editContractRequestSchema)
    const contract = await contractsContainer.editContractUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      data: contractEditData(body),
    })
    return NextResponse.json({ contract })
  },
)
