import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { updateTenantAccountRequestSchema } from '@server/platform/schemas/update-tenant-account.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const body = await parseJsonBody(request, updateTenantAccountRequestSchema)

  const tenant = await platformContainer.updateTenantAccountUseCase.execute({
    tenantId: (await context.params).id,
    accountType: body.accountType,
    status: body.status,
  })

  return NextResponse.json({ tenant: toPlatformTenantResponse(tenant) }, { status: 200 })
})
