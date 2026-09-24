import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { logoutRequestSchema } from '@server/auth/schemas/logout.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, logoutRequestSchema)

  await authContainer.logoutUseCase.execute({ refreshToken: body.refreshToken })

  return new NextResponse(null, { status: 204 })
})
