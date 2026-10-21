import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformPlanResponse } from '@server/platform/domain/platform-plan'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const plans = await platformContainer.listPlatformPlansUseCase.execute()

  return NextResponse.json({ plans: plans.map(toPlatformPlanResponse) }, { status: 200 })
})
