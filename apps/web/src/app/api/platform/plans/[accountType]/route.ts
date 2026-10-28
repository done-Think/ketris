import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { PlatformAccountTypeRouteContext } from '@server/platform/types/http'

import { platformContainer } from '@server/platform/container'
import { PlatformPlanNotFoundError } from '@server/platform/domain/errors'
import { toPlatformPlanResponse } from '@server/platform/domain/platform-plan'
import {
  BILLING_EDITOR_ROLES,
  requirePlatformAdminRole,
} from '@server/platform/require-platform-admin-role'
import { updatePlatformPlanRequestSchema } from '@server/platform/schemas/platform-plan.schema'
import { tenantAccountTypeSchema } from '@server/platform/schemas/tenant.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: PlatformAccountTypeRouteContext) => {
    const actor = await requirePlatformAdminRole(
      request,
      platformContainer.tokenService,
      platformContainer.platformAdminRepository,
      BILLING_EDITOR_ROLES,
    )
    const accountType = tenantAccountTypeSchema.safeParse((await context.params).accountType)
    if (!accountType.success) throw new PlatformPlanNotFoundError()
    const body = await parseJsonBody(request, updatePlatformPlanRequestSchema)

    const plan = await platformContainer.updatePlatformPlanUseCase.execute({
      accountType: accountType.data,
      ...body,
      actor: { id: actor.id, name: actor.name },
    })

    return NextResponse.json({ plan: toPlatformPlanResponse(plan) }, { status: 200 })
  },
)
