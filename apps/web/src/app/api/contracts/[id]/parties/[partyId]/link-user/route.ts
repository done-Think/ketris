import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { linkContractPartyUserRequestSchema } from '@server/contracts/schemas/contract-input.schema'
import type { LinkContractPartyUserRouteContext } from '@server/contracts/types/contract-party-user-link'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: LinkContractPartyUserRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const body = await parseJsonBody(request, linkContractPartyUserRequestSchema)
    const { id, partyId } = await context.params

    const link = await contractsContainer.linkContractPartyUserUseCase.execute({
      actorTenantId: actor.tenantId,
      actorPapel: actor.papel as Papel,
      contractId: id,
      partyId,
      email: body.email,
    })

    return NextResponse.json(link, { status: 200 })
  },
)
