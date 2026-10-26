import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { agencyDashboardContainer } from '@server/agency-dashboard/container'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const overview = await agencyDashboardContainer.getAgencyOverviewUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
  })

  return NextResponse.json(overview, { status: 200 })
})
