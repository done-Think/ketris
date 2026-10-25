import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { toAuthenticatedUserResponse } from '@server/auth/application/user-response'
import { loginRequestSchema } from '@server/auth/schemas/login.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'
import { EmailNotVerifiedError, TenantSelectionRequiredError } from '@server/auth/domain/errors'
import { startEmailVerification } from '@server/auth/application/start-email-verification'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, loginRequestSchema)

  try {
    const { user, accessToken, refreshToken } = await authContainer.loginUseCase.execute(body)
    return NextResponse.json(
      { user: toAuthenticatedUserResponse(user), accessToken, refreshToken },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof EmailNotVerifiedError && error.verification) {
      return NextResponse.json(
        await startEmailVerification(
          { ...error.verification, locale: body.locale },
          authContainer.requestSignupVerificationUseCase,
        ),
      )
    }
    if (error instanceof TenantSelectionRequiredError) {
      return NextResponse.json({ outcome: 'SELECT_TENANT', tenants: error.tenants })
    }
    throw error
  }
})
