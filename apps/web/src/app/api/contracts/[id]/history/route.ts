import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { contractIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import { contractHistoryQuerySchema } from '@server/contracts/schemas/contract-workflow.schema'
import type { ContractRouteContext } from '@server/contracts/types/route-context'
import { parseQuery, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)
    const query = parseQuery(request, contractHistoryQuerySchema)
    const history = await contractsContainer.listContractHistoryUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      ...query,
    })
    return NextResponse.json(history)
  },
)
