import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { verifyDeletionReceipt } from '@server/instagram/http/signed-request'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const receipt = verifyDeletionReceipt(request.nextUrl.searchParams.get('receipt') ?? '')
  return NextResponse.json(
    {
      confirmation_code: receipt.code,
      completed_at: receipt.completedAt,
      status: 'completed',
      scope:
        'Instagram integration data stored by Ketris; site properties and posts already published on Instagram are not deleted.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
