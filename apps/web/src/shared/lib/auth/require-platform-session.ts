import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getPathname } from '@/i18n/navigation'
import { resolveLocale } from '@/i18n/routing'
import { authOptions } from './auth-options'
import { AuthenticationUnavailableError } from './authentication-unavailable-error'

export async function requirePlatformSession(locale: string | undefined): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) throw new AuthenticationUnavailableError()

  if (!session || session.scope !== 'platform') {
    redirect(getPathname({ href: '/platform/login', locale: resolveLocale(locale) }))
  }

  return session
}
