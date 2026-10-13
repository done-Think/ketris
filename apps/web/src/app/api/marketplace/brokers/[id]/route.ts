import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (_request: NextRequest, context: RouteContext) => {
  const broker = await marketplaceContainer.getBrokerProfileUseCase.execute({
    id: (await context.params).id,
  })

  return NextResponse.json({ broker }, { status: 200 })
})
