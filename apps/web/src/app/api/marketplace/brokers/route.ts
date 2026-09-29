import { NextResponse } from 'next/server'

import { marketplaceContainer } from '@server/marketplace/container'
import { withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async () => {
  const brokers = await marketplaceContainer.listBrokerProfilesUseCase.execute()

  return NextResponse.json({ brokers }, { status: 200 })
})
