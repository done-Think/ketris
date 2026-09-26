import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import type { Papel } from '@server/auth/domain/user.entity'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import { RequestValidationError, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw new RequestValidationError([{ path: 'file', message: 'Envie um arquivo em "file".' }])
  }

  const body = Buffer.from(await file.arrayBuffer())

  const media = await propertiesContainer.uploadPropertyMediaUseCase.execute({
    actorTenantId: actor.tenantId,
    actorPapel: actor.papel as Papel,
    filename: file.name,
    contentType: file.type,
    body,
  })

  return NextResponse.json({ media }, { status: 201 })
})
