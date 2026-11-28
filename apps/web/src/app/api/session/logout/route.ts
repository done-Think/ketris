import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { authContainer } from '@server/auth/container'
import { platformContainer } from '@server/platform/container'
import { withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (token?.refreshToken) {
    if (token.scope === 'platform') {
      await platformContainer.logoutPlatformAdminUseCase.execute(token.refreshToken)
    } else if (token.scope === 'tenant') {
      await authContainer.logoutUseCase.execute({ refreshToken: token.refreshToken })
    }
  }

  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
})
