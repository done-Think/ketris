import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { authOptions } from './auth-options'

export async function requirePlatformSession(locale: string | undefined): Promise<Session> {
  const session = await getServerSession(authOptions)

  if (!session || session.scope !== 'platform') {
    redirect(getLocalizedPathname('/platform/login', locale))
  }

  return session
}
