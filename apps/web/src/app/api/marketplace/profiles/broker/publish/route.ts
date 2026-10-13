import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const profile = await marketplaceContainer.publishBrokerProfileUseCase.execute({
    actorId: actor.sub,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json({ profile }, { status: 200 })
})
