import { authContainer } from '@server/auth/container'
import { assertInstagramActor } from '@server/instagram/domain/access'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@shared/lib/auth/auth-options'
import { instagramContainer } from '@server/instagram/container'
import { getInstagramConfig } from '@server/instagram/config'
import { InstagramError } from '@server/instagram/domain/errors'

export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  const config = getInstagramConfig()
  const redirect = new URL('/pt/dashboard/profile', config.mediaOrigin)
  try {
    const session = await getServerSession(authOptions)
    if (
      !session?.user?.id ||
      !session.tenantId ||
      !session.accessToken ||
      session.scope === 'platform' ||
      request.nextUrl.searchParams.has('error')
    )
      throw new InstagramError('INSTAGRAM_OAUTH_CANCELLED')
    const token = await authContainer.tokenService.verify(session.accessToken)
    if (token.sub !== session.user.id || token.tenantId !== session.tenantId)
      throw new InstagramError('INSTAGRAM_OAUTH_CANCELLED')
    const actor = { tenantId: token.tenantId, id: token.sub, role: token.role }
    assertInstagramActor(actor)
    await instagramContainer.connect.finish(
      actor,
      request.nextUrl.searchParams.get('state') ?? '',
      request.cookies.get('ketris-instagram-oauth')?.value ?? '',
      request.nextUrl.searchParams.get('code') ?? '',
    )
    redirect.searchParams.set('instagram', 'connected')
  } catch {
    redirect.searchParams.set('instagram', 'error')
  }
  const response = NextResponse.redirect(redirect)
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.cookies.set('ketris-instagram-oauth', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/instagram/oauth/callback',
    maxAge: 0,
  })
  return response
}
