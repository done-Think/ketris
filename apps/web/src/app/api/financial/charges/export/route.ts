import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { financialContainer } from '@server/financial/container'
import { exportChargesQuerySchema } from '@server/financial/schemas/charge-input.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, exportChargesQuerySchema)

  const file = await financialContainer.exportChargesUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    month: query.month,
    locale: query.locale,
  })

  return new NextResponse(file.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  })
})
