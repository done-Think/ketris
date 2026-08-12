import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { refreshTokenRequestSchema } from '@server/auth/schemas/refresh-token.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, refreshTokenRequestSchema)

  const { accessToken, refreshToken } = await authContainer.refreshAccessTokenUseCase.execute({
    refreshToken: body.refreshToken,
  })

  return NextResponse.json({ accessToken, refreshToken }, { status: 200 })
})
