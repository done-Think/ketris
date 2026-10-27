import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { marketplaceMediaParamsSchema } from '@server/marketplace/schemas/route-params.schema'
import type { MarketplaceMediaRouteContext } from '@server/marketplace/types/http'
import { parseRouteParams, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(
  async (_request: NextRequest, context: MarketplaceMediaRouteContext) => {
    const { key } = await parseRouteParams(context.params, marketplaceMediaParamsSchema)
    const media = await marketplaceContainer.getProfileMediaUseCase.execute(key)

    return new NextResponse(Buffer.from(media.body), {
      status: 200,
      headers: {
        'Content-Type': media.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  },
)
