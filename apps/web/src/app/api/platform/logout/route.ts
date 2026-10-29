import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { refreshPlatformTokenRequestSchema } from '@server/platform/schemas/refresh-platform-token.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, refreshPlatformTokenRequestSchema)
  await platformContainer.logoutPlatformAdminUseCase.execute(body.refreshToken)
  return new NextResponse(null, { status: 204 })
})
