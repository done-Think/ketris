import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { bootstrapPlatformAdminRequestSchema } from '@server/platform/schemas/bootstrap-platform-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, bootstrapPlatformAdminRequestSchema)

  const admin = await platformContainer.bootstrapPlatformAdminUseCase.execute({
    nome: body.nome,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ admin }, { status: 201 })
})
