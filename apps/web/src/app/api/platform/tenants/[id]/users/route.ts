import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const users = await platformContainer.listTenantUsersUseCase.execute({
    tenantId: context.params.id,
  })

  return NextResponse.json({ users }, { status: 200 })
})
