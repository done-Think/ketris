import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createTenantRequestSchema } from '@server/platform/schemas/create-tenant.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const tenants = await platformContainer.listTenantsUseCase.execute()

  return NextResponse.json({ tenants }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, createTenantRequestSchema)

  const tenant = await platformContainer.createTenantUseCase.execute({
    nome: body.nome,
    slug: body.slug,
  })

  return NextResponse.json({ tenant }, { status: 201 })
})
