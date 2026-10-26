import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { contractIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import { transitionContractRequestSchema } from '@server/contracts/schemas/contract-workflow.schema'
import type { ContractRouteContext } from '@server/contracts/types/route-context'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)
    const { reason } = await parseJsonBody(request, transitionContractRequestSchema)
    const contract = await contractsContainer.transitionContractUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      reason,
      action: 'CANCEL',
    })
    return NextResponse.json({ contract })
  },
)
