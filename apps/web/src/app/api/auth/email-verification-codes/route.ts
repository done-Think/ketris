import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requestSignupVerificationSchema } from '@server/auth/schemas/email-verification.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import {
  EmailDeliveryFailedError,
  EmailVerificationRateLimitError,
} from '@server/auth/domain/errors'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await parseJsonBody(request, requestSignupVerificationSchema)
  try {
    await authContainer.requestSignupVerificationUseCase.execute(input)
  } catch (error) {
    if (
      !(error instanceof EmailVerificationRateLimitError) &&
      !(error instanceof EmailDeliveryFailedError)
    )
      throw error
  }
  return new NextResponse(null, { status: 204 })
})
