import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { toFinancialSummaryResponse } from '@server/financial/application/charge-response'
import { financialSummaryQuerySchema } from '@server/financial/schemas/charge-input.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, financialSummaryQuerySchema)

  const summary = await financialContainer.getFinancialSummaryUseCase.execute({
    actorRole: actor.role,
    actorTenantId: actor.tenantId,
    month: query.month,
  })

  return NextResponse.json(toFinancialSummaryResponse(summary), { status: 200 })
})
