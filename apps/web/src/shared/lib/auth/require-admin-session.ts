import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { authOptions } from './auth-options'

export async function requireAdminSession(locale: string | undefined): Promise<Session> {
  const session = await getServerSession(authOptions)

  if (!session || session.papel !== 'ADMIN') {
    redirect(getLocalizedPathname('/backoffice/login', locale))
  }

  return session
}
