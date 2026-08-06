import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createTenantAdminRequestSchema } from '@server/platform/schemas/create-tenant-admin.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: { id: string }
}

export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, createTenantAdminRequestSchema)

  const user = await platformContainer.createTenantAdminUseCase.execute({
    tenantId: context.params.id,
    nome: body.nome,
    email: body.email,
    password: body.password,
  })

  return NextResponse.json({ user }, { status: 201 })
})
