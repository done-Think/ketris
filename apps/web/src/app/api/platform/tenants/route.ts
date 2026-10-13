import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toTenantSummaryResponse } from '@server/platform/domain/tenant-summary.entity'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createTenantRequestSchema } from '@server/platform/schemas/create-tenant.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const tenants = await platformContainer.listTenantsUseCase.execute()

  return NextResponse.json({ tenants: tenants.map(toTenantSummaryResponse) }, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, createTenantRequestSchema)

  const tenant = await platformContainer.createTenantUseCase.execute({
    nome: body.name,
    slug: body.slug,
  })

  return NextResponse.json({ tenant: toTenantSummaryResponse(tenant) }, { status: 201 })
})
