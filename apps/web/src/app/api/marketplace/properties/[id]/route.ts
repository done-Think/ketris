import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = withErrorHandling(async (_request: NextRequest, context: RouteContext) => {
  const property = await marketplaceContainer.getPropertyUseCase.execute({
    propertyId: (await context.params).id,
  })

  return NextResponse.json({ property }, { status: 200 })
})
