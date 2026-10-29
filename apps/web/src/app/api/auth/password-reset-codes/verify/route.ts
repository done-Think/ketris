import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { verifyPasswordResetCodeSchema } from '@server/auth/schemas/password-reset-code.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, verifyPasswordResetCodeSchema)

  const result = await authContainer.verifyPasswordResetCodeUseCase.execute({
    email: body.email,
    code: body.code,
    tenantId: body.tenantId,
  })

  return NextResponse.json(result, { status: 200 })
})
