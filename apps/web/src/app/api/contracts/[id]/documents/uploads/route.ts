import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { contractIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import type { ContractRouteContext } from '@server/contracts/types/route-context'
import { initContractDocumentRequestSchema } from '@server/contracts/schemas/contract-document.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: ContractRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const { id } = await parseRouteParams(context.params, contractIdParamsSchema)
    const data = await parseJsonBody(request, initContractDocumentRequestSchema)
    const result = await contractsContainer.initContractDocumentUploadUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorRole: actor.role,
      contractId: id,
      ...data,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  },
)
