import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { UserNotFoundError } from '@server/auth/domain/errors'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { changeOwnPasswordRequestSchema } from '@server/auth/schemas/change-own-password.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, changeOwnPasswordRequestSchema)
  const user = await authContainer.userRepository.findById(actor.sub)

  if (!user || user.tenantId !== actor.tenantId || !user.ativo) {
    throw new UserNotFoundError()
  }

  await authContainer.changeOwnPasswordUseCase.execute({
    userId: user.id,
    currentPassword: body.currentPassword,
    password: body.password,
  })

  return new NextResponse(null, { status: 204 })
})
