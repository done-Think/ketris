import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { parseUploadedFile, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const formData = await request.formData()
  const file = parseUploadedFile(formData)

  const body = Buffer.from(await file.arrayBuffer())

  const media = await propertiesContainer.uploadPropertyMediaUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel,
    filename: file.name,
    contentType: file.type,
    body,
  })

  return NextResponse.json({ media }, { status: 201 })
})
