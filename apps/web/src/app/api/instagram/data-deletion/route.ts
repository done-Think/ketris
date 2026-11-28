import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { getInstagramConfig } from '@server/instagram/config'
import { instagramContainer } from '@server/instagram/container'
import {
  deletionReceipt,
  verifyInstagramSignedRequest,
} from '@server/instagram/http/signed-request'

export const runtime = 'nodejs'
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.formData()
  const userId = verifyInstagramSignedRequest(String(body.get('signed_request') ?? ''))
  await instagramContainer.deleteData.execute(userId)
  const confirmation = randomUUID()
  const url = new URL('/api/instagram/deletion-status', getInstagramConfig().mediaOrigin)
  url.searchParams.set('receipt', deletionReceipt(confirmation, new Date().toISOString()))
  return NextResponse.json({ url: url.toString(), confirmation_code: confirmation })
})
