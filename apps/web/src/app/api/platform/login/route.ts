import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { loginPlatformRequestSchema } from '@server/platform/schemas/login-platform.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, loginPlatformRequestSchema)

  const { admin, accessToken, refreshToken } =
    await platformContainer.loginPlatformAdminUseCase.execute({
      email: body.email,
      password: body.password,
    })

  return NextResponse.json({ admin, accessToken, refreshToken }, { status: 200 })
})
