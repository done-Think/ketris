import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { withErrorHandling } from '@server/shared/http'
import { teamContainer } from '@server/team/container'
import { toTeamOverviewResponse } from '@server/team/domain/team-response'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const overview = await teamContainer.getTeamOverviewUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
  })

  return NextResponse.json(toTeamOverviewResponse(overview), { status: 200 })
})
