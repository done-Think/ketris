import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { parseUploadedFile, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const form = await request.formData()
  const file = parseUploadedFile(form)
  const media = await authContainer.uploadAvatarUseCase.execute({
    actorId: actor.sub,
    actorTenantId: actor.tenantId,
    filename: file.name,
    contentType: file.type,
    body: Buffer.from(await file.arrayBuffer()),
  })
  return NextResponse.json({ media }, { status: 201 })
})
