import type { ContractPartyRouteContext } from '@server/contracts/types/route-context'
import { contractPartyIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { linkContractPartyUserRequestSchema } from '@server/contracts/schemas/contract-input.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: ContractPartyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const body = await parseJsonBody(request, linkContractPartyUserRequestSchema)
    const { id, partyId } = await parseRouteParams(context.params, contractPartyIdParamsSchema)

    const link = await contractsContainer.linkContractPartyUserUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      partyId,
      email: body.email,
    })

    return NextResponse.json(link, { status: 200 })
  },
)
