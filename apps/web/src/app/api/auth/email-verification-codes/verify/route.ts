import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { confirmSignupVerificationSchema } from '@server/auth/schemas/email-verification.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await parseJsonBody(request, confirmSignupVerificationSchema)
  const result = await authContainer.confirmSignupVerificationUseCase.execute(input)
  return NextResponse.json(
    result.outcome === 'REGISTERED'
      ? { ...result, user: toAuthenticatedUserResponse(result.user) }
      : result,
  )
})
