import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { bootstrapAdminRequestSchema } from '@server/auth/schemas/bootstrap-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJsonBody(request, bootstrapAdminRequestSchema)

  const user = await authContainer.bootstrapAdminUseCase.execute({
    tenantSlug: body.tenantSlug,
    nome: body.nome,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ user }, { status: 201 })
})
