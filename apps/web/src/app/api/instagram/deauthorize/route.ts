import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { verifyInstagramSignedRequest } from '@server/instagram/http/signed-request'
import { instagramContainer } from '@server/instagram/container'

export const runtime = 'nodejs'
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.formData()
  const userId = verifyInstagramSignedRequest(String(body.get('signed_request') ?? ''))
  await instagramContainer.deleteData.execute(userId)
  return NextResponse.json({ success: true })
})
