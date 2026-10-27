import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { searchPropertiesQuerySchema } from '@server/marketplace/schemas/search-properties.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseQuery(request, searchPropertiesQuerySchema)
  const { items, totalCount, page, pageSize } =
    await marketplaceContainer.searchPropertiesUseCase.execute(query)

  return NextResponse.json({ properties: items, totalCount, page, pageSize }, { status: 200 })
})
