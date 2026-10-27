import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { directoryQuerySchema } from '@server/marketplace/schemas/directory.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseQuery(request, directoryQuerySchema)
  const { items, totalCount, page, pageSize } =
    await marketplaceContainer.listAgencyProfilesUseCase.execute(query)

  return NextResponse.json({ agencies: items, totalCount, page, pageSize }, { status: 200 })
})
