import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { instagramActor } from '@server/instagram/http/auth'
import { instagramContainer } from '@server/instagram/container'
import { getInstagramConfig, instagramEnabled } from '@server/instagram/config'

export const runtime = 'nodejs'
export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await instagramActor(request)
  if (!instagramEnabled())
    return NextResponse.json(
      { configured: false, connected: false },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  getInstagramConfig()
  const connection = await instagramContainer.repository.connection(actor.tenantId, actor.id)
  return NextResponse.json(
    {
      configured: true,
      connected: Boolean(connection),
      accountId: connection?.accountId,
      username: connection?.username,
      expiresAt: connection?.expiresAt.toISOString(),
      expired: connection ? connection.expiresAt.getTime() <= Date.now() : false,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const actor = await instagramActor(request)
  getInstagramConfig()
  await instagramContainer.repository.disconnect(actor.tenantId, actor.id)
  return NextResponse.json({ connected: false })
})
