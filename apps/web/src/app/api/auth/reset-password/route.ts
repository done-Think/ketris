import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { resetPasswordRequestSchema } from '@server/auth/schemas/reset-password.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, resetPasswordRequestSchema)

  await authContainer.resetPasswordUseCase.execute({
    email: body.email,
    password: body.password,
  })

  return new NextResponse(null, { status: 204 })
})
