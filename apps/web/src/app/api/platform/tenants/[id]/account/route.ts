import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import {
  BILLING_EDITOR_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { updateTenantAccountRequestSchema } from '@server/platform/schemas/update-tenant-account.schema'
import type { PlatformIdRouteContext } from '@server/platform/types/http'
import { platformIdParamsSchema } from '@server/platform/schemas/route-params.schema'
import { parseJsonBody, parseRouteParams, withErrorHandling } from '@server/shared/http'

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: PlatformIdRouteContext) => {
    const actor = await requirePlatformAdminRole(
      request,
      platformContainer.tokenService,
      platformContainer.platformAdminRepository,
      BILLING_EDITOR_ROLES,
    )
    const { id } = await parseRouteParams(context.params, platformIdParamsSchema)
    const body = await parseJsonBody(request, updateTenantAccountRequestSchema)

    const tenant = await platformContainer.updateTenantAccountUseCase.execute({
      tenantId: id,
      accountType: body.accountType,
      status: body.status,
      actorId: actor.id,
    })

    return NextResponse.json({ tenant: toPlatformTenantResponse(tenant) }, { status: 200 })
  },
)
