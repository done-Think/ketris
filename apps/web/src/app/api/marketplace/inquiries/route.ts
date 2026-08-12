import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { marketplaceContainer } from '@server/marketplace/container'
import { listInquiriesQuerySchema } from '@server/marketplace/schemas/list-inquiries.schema'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)

  const parsed = listInquiriesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!parsed.success) {
    throw new RequestValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    )
  }

  const inquiries = await marketplaceContainer.listInquiriesUseCase.execute({
    actorTenantId: actor.tenantId,
    status: parsed.data.status,
    includeArchived: parsed.data.includeArchived,
  })

  return NextResponse.json({ inquiries }, { status: 200 })
})
