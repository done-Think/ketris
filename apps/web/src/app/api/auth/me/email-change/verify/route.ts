import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { confirmEmailChangeSchema } from '@server/auth/schemas/email-verification.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const input = await parseJsonBody(request, confirmEmailChangeSchema)
  await authContainer.confirmEmailChangeUseCase.execute({
    ...input,
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
  })
  return new NextResponse(null, { status: 204 })
})
