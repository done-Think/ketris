import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async () => {
  const stats = await marketplaceContainer.getMarketplaceStatsUseCase.execute()

  return NextResponse.json(stats, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
})
