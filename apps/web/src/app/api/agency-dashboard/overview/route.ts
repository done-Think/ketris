import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { agencyDashboardContainer } from '@server/agency-dashboard/container'
import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const overview = await agencyDashboardContainer.getAgencyOverviewUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
  })

  return NextResponse.json(overview, { status: 200 })
})
