import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { contractDocumentParamsSchema } from '@server/contracts/schemas/contract-document.schema'
import type { ContractDocumentRouteContext } from '@server/contracts/types/route-context'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (request: NextRequest, context: ContractDocumentRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id, documentId } = await parseRouteParams(context.params, contractDocumentParamsSchema)
    const result = await contractsContainer.downloadContractDocumentUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      documentId,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  },
)
