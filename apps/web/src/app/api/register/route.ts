import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { toAuthenticatedUserResponse } from '@server/auth/domain/user.entity'
import { registrationContainer } from '@server/registration/container'
import { registerRequestSchema } from '@server/registration/schemas/register.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, registerRequestSchema)

  if (body.profile === 'corretor' && body.agencyId) {
    const result = await registrationContainer.registerTenantAgentUseCase.execute({
      agencyId: body.agencyId,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    })

    return NextResponse.json({ outcome: 'PENDING_APPROVAL', email: result.email }, { status: 202 })
  }

  if (body.profile === 'locatario') {
    const result = await registrationContainer.registerRenterUseCase.execute({
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    })

    return NextResponse.json(
      {
        outcome: 'REGISTERED',
        user: toAuthenticatedUserResponse(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      { status: 201 },
    )
  }

  const result = await registrationContainer.registerTenantOwnerUseCase.execute({
    fullName: body.fullName,
    companyName: body.companyName,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json(
    {
      outcome: 'REGISTERED',
      user: toAuthenticatedUserResponse(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    { status: 201 },
  )
})
