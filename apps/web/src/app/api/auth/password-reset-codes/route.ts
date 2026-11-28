import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requestPasswordResetCodeSchema } from '@server/auth/schemas/password-reset-code.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import { describeFailure } from '@server/shared/observability/describe-failure'
import { failureReporter } from '@server/shared/observability/sentry-failure-reporter'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, requestPasswordResetCodeSchema)

  // Account lookup and delivery run after the response so its timing never reveals whether
  // the address belongs to an account.
  after(async () => {
    try {
      await authContainer.requestPasswordResetCodeUseCase.execute({
        email: body.email,
        locale: body.locale,
      })
    } catch (error) {
      console.error('[auth] Password recovery request failed.', describeFailure(error))
      failureReporter.report({ module: 'auth', operation: 'password_reset_request', error })
    }
  })

  return new NextResponse(null, { status: 204 })
})
