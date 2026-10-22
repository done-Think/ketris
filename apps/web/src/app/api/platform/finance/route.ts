import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { platformContainer } from '@server/platform/container'
import { toPlatformTenantResponse } from '@server/platform/domain/platform-tenant.entity'
import { requirePlatformBearerAuth } from '@server/platform/require-platform-bearer-auth'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requirePlatformBearerAuth(request, platformContainer.tokenService)

  const { accounts, ...finance } = await platformContainer.getPlatformFinanceUseCase.execute()

  return NextResponse.json(
    { ...finance, accounts: accounts.map(toPlatformTenantResponse) },
    { status: 200 },
  )
})
