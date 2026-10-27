import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { listPublicProfilesQuerySchema } from '@server/marketplace/schemas/profile-directory.schema'
import { parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseQuery(request, listPublicProfilesQuerySchema)
  const { items, totalCount, page, pageSize } =
    await marketplaceContainer.listAgencyProfilesUseCase.execute(query)

  return NextResponse.json({ agencies: items, totalCount, page, pageSize }, { status: 200 })
})
