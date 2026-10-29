import type { PrismaClient } from '@prisma/client'
import { decodeJwt } from 'jose'
import { encode } from 'next-auth/jwt'

import { getDatabaseUrl } from '../../src/server/db/database-url'
import type { SessionCookieInput, SessionCookieFixtures } from '../types/session-cookies'

export async function createSessionCookies(
  prisma: PrismaClient,
  baseUrl: string,
  input: SessionCookieInput,
): Promise<SessionCookieFixtures> {
  const localHosts = ['localhost', '127.0.0.1', '[::1]']
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !localHosts.includes(new URL(getDatabaseUrl()).hostname) ||
    !localHosts.includes(new URL(baseUrl).hostname) ||
    !process.env.NEXTAUTH_SECRET
  )
    throw new Error('Session cookie fixtures require a local isolated application and database.')

  const user = await prisma.user.findFirst({
    where: {
      tenantId: input.tenantId,
      email: input.email,
      tenant: { slug: { startsWith: 'contract-' } },
    },
  })
  const claims = decodeJwt(input.accessToken)
  if (
    !user ||
    claims.sub !== user.id ||
    claims.tenantId !== user.tenantId ||
    claims.role !== user.role
  )
    throw new Error('Session cookie fixture does not match its user.')

  const token = {
    sub: user.id,
    name: user.name,
    email: user.email,
    scope: 'tenant' as const,
    tenantId: user.tenantId,
    sessionVersion: user.sessionVersion,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  }
  const settings = { secret: process.env.NEXTAUTH_SECRET, maxAge: 300 }
  return {
    current: await encode({ ...settings, token: { ...token, role: user.role } }),
    retired: await encode({ ...settings, token: { ...token, papel: user.role } }),
  }
}
