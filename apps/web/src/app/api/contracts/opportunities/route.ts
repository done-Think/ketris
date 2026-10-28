import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { listContractOpportunitiesQuerySchema } from '@server/contracts/schemas/contract-opportunity.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listContractOpportunitiesQuerySchema)
  const result = await contractsContainer.listContractOpportunitiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorRole: actor.role,
    ...query,
  })
  return NextResponse.json(result)
})
