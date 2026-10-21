import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import {
  BILLING_EDITOR_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { updateTenantAccountRequestSchema } from '@server/platform/schemas/update-tenant-account.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const actor = await requirePlatformAdminRole(
    request,
    platformContainer.tokenService,
    platformContainer.platformAdminRepository,
    BILLING_EDITOR_ROLES,
  )
  const body = await parseJsonBody(request, updateTenantAccountRequestSchema)

  const tenant = await platformContainer.updateTenantAccountUseCase.execute({
    tenantId: (await context.params).id,
    accountType: body.accountType,
    status: body.status,
    actorId: actor.id,
  })

  return NextResponse.json({ tenant: toPlatformTenantResponse(tenant) }, { status: 200 })
})
