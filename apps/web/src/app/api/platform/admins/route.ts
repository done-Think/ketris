import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createPlatformAdminRequestSchema } from '@server/platform/schemas/create-platform-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, createPlatformAdminRequestSchema)

  const admin = await platformContainer.createPlatformAdminUseCase.execute({
    nome: body.nome,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ admin }, { status: 201 })
})

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const admins = await platformContainer.listPlatformAdminsUseCase.execute()

  return NextResponse.json({ admins }, { status: 200 })
})
