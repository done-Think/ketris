import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authContainer } from '@server/auth/container'
import { UserNotFoundError } from '@server/auth/domain/errors'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { resetPasswordRequestSchema } from '@server/auth/schemas/reset-password.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

const changeOwnPasswordSchema = z.object({
  password: resetPasswordRequestSchema.shape.password,
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, changeOwnPasswordSchema)
  const user = await authContainer.userRepository.findById(actor.sub)

  if (!user || user.tenantId !== actor.tenantId || !user.ativo) {
    throw new UserNotFoundError()
  }

  await authContainer.changeOwnPasswordUseCase.execute({ userId: user.id, password: body.password })

  return new NextResponse(null, { status: 204 })
})
