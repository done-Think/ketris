import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { PlatformPlanNotFoundError } from '@server/platform/domain/errors'
import { toPlatformPlanResponse } from '@server/platform/domain/platform-plan'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { updatePlatformPlanRequestSchema } from '@server/platform/schemas/platform-plan.schema'
import { tenantAccountTypeSchema } from '@server/platform/schemas/tenant.schema'
import { parseJsonBody, withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ accountType: string }>
}

export const PATCH = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)
  const accountType = tenantAccountTypeSchema.safeParse((await context.params).accountType)
  if (!accountType.success) throw new PlatformPlanNotFoundError()
  const body = await parseJsonBody(request, updatePlatformPlanRequestSchema)

  const plan = await platformContainer.updatePlatformPlanUseCase.execute({
    accountType: accountType.data,
    ...body,
  })

  return NextResponse.json({ plan: toPlatformPlanResponse(plan) }, { status: 200 })
})
