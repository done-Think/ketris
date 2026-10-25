import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { publicConfirmEmailChangeSchema } from '@server/auth/schemas/email-verification.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await parseJsonBody(request, publicConfirmEmailChangeSchema)
  await authContainer.confirmPublicEmailChangeUseCase.execute(input)
  return new NextResponse(null, { status: 204 })
})
