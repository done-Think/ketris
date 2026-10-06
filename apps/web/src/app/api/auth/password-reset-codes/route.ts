import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requestPasswordResetCodeSchema } from '@server/auth/schemas/password-reset-code.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, requestPasswordResetCodeSchema)

  await authContainer.requestPasswordResetCodeUseCase.execute({ email: body.email })

  return new NextResponse(null, { status: 204 })
})
