import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string; partyId: string }>
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const { id, partyId } = await context.params

  const contract = await contractsContainer.signContractPartyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    contractId: id,
    partyId,
  })

  return NextResponse.json({ contract }, { status: 200 })
})
