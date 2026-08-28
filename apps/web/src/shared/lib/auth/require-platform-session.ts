import type { Session } from 'next-auth'
import { getLocale } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { authOptions } from './auth-options'

export async function requirePlatformSession(): Promise<Session> {
  const [locale, session] = await Promise.all([getLocale(), getServerSession(authOptions)])

  if (!session || session.scope !== 'platform') {
    redirect(getLocalizedPathname('/platform/login', locale))
  }

  return session
}
