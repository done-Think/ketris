import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async () => {
  const agencies = await marketplaceContainer.listAgencyProfilesUseCase.execute()

  return NextResponse.json({ agencies }, { status: 200 })
})
