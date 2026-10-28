import type { ContractPartyRouteContext } from '@server/contracts/types/route-context'
import { contractPartyIdParamsSchema } from '@server/contracts/schemas/contract.schema'
import type { NextRequest } from 'next/server'
import { isIP } from 'node:net'
import { getTrustedClientAddress } from '@server/security/client-key'
import { signContractPartyRequestSchema } from '@server/contracts/schemas/contract-workflow.schema'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { contractsContainer } from '@server/contracts/container'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(
  async (request: NextRequest, context: ContractPartyRouteContext) => {
    const actor = await requireBearerAuth(request, authContainer.tokenService)
    const body = await parseJsonBody(request, signContractPartyRequestSchema)
    const address = getTrustedClientAddress(request.headers)
    const { id, partyId } = await parseRouteParams(context.params, contractPartyIdParamsSchema)

    const contract = await contractsContainer.signContractPartyUseCase.execute({
      actorTenantId: actor.tenantId,
      actorId: actor.sub,
      actorRole: actor.role,
      contractId: id,
      partyId,
      documentId: body.documentId,
      clientIp: isIP(address) ? address : null,
      userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
    })

    return NextResponse.json({ contract }, { status: 200 })
  },
)
