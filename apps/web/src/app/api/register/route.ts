import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { startEmailVerification } from '@server/auth/application/start-email-verification'
import { authContainer } from '@server/auth/container'
import { registrationContainer } from '@server/registration/container'
import { registerRequestSchema } from '@server/registration/schemas/register.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, registerRequestSchema)
  const details = {
    fullName: body.fullName,
    email: body.email,
    password: body.password,
    phone: body.phone,
    acceptTerms: body.acceptTerms,
  }
  const result =
    body.profile === 'broker' && body.agencyId
      ? await registrationContainer.registerTenantAgentUseCase.execute({
          ...details,
          agencyId: body.agencyId,
          creci: body.creci,
        })
      : body.profile === 'renter'
        ? await registrationContainer.registerRenterUseCase.execute(details)
        : await registrationContainer.registerTenantOwnerUseCase.execute({
            ...details,
            profile: body.profile,
            companyName: body.companyName,
            ...(body.profile === 'broker' ? { creci: body.creci } : {}),
          })

  const response = await startEmailVerification(
    { email: result.email, tenantId: result.tenantId, locale: body.locale },
    authContainer.requestSignupVerificationUseCase,
  )
  return NextResponse.json(response, { status: result.pendingApproval ? 202 : 201 })
})
