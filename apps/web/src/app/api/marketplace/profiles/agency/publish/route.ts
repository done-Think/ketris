import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const profile = await marketplaceContainer.publishAgencyProfileUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
  })

  return NextResponse.json({ profile }, { status: 200 })
})
