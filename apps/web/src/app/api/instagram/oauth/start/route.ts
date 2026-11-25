import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@server/shared/http'
import { instagramActor } from '@server/instagram/http/auth'
import { instagramContainer } from '@server/instagram/container'

export const runtime = 'nodejs'
export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await instagramActor(request)
  const { authorizationUrl, verifier } = await instagramContainer.connect.start(actor)
  const response = NextResponse.json(
    { authorizationUrl },
    { headers: { 'Cache-Control': 'no-store' } },
  )
  response.cookies.set('ketris-instagram-oauth', verifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/instagram/oauth/callback',
    maxAge: 600,
  })
  return response
})
