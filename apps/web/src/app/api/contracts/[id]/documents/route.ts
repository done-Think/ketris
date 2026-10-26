import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { contractIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import type { ContractRouteContext } from '@server/contracts/types/route-context'
import { confirmContractDocumentRequestSchema } from '@server/contracts/schemas/contract-document.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)
    const data = await parseJsonBody(request, confirmContractDocumentRequestSchema)
    const result = await contractsContainer.confirmContractDocumentUploadUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorPapel: actor.papel,
      contractId: id,
      ...data,
    })
    return NextResponse.json(
      { document: result },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  },
)
