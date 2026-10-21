import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const summary = await financialContainer.getFinancialSummaryUseCase.execute({
    actorPapel: actor.papel as Papel,
    actorTenantId: actor.tenantId,
  })

  return NextResponse.json(summary, { status: 200 })
})
