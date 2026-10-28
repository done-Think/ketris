import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { marketplaceIdParamsSchema } from '@server/marketplace/schemas/route-params.schema'
import type { MarketplaceIdRouteContext } from '@server/marketplace/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (_request: NextRequest, context: MarketplaceIdRouteContext) => {
    const { id } = await parseRouteParams(context.params, marketplaceIdParamsSchema)
    const broker = await marketplaceContainer.getBrokerProfileUseCase.execute({
      id,
    })

    return NextResponse.json({ broker }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  },
)
