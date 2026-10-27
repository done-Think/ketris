import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import { toTenantSummaryResponse } from '@server/platform/domain/tenant-summary.entity'
import {
  PLATFORM_MANAGER_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { createTenantRequestSchema } from '@server/platform/schemas/create-tenant.schema'
import { listTenantsQuerySchema } from '@server/platform/schemas/list-tenants.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const query = parseQuery(request, listTenantsQuerySchema)
  const { items, ...page } = await platformContainer.listTenantsUseCase.execute(query)

  return NextResponse.json(
    { tenants: items.map(toPlatformTenantResponse), ...page },
    { status: 200 },
  )
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformAdminRole(
    request,
    platformContainer.tokenService,
    platformContainer.platformAdminRepository,
    PLATFORM_MANAGER_ROLES,
  )
  const body = await parseJsonBody(request, createTenantRequestSchema)

  const tenant = await platformContainer.createTenantUseCase.execute({
    nome: body.name,
    slug: body.slug,
    accountType: body.accountType,
    status: body.status,
  })

  return NextResponse.json({ tenant: toTenantSummaryResponse(tenant) }, { status: 201 })
})
