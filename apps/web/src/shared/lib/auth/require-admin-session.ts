import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from './auth-options'

export async function requireAdminSession(): Promise<Session> {
  const session = await getServerSession(authOptions)

  if (!session || session.papel !== 'ADMIN') {
    redirect('/backoffice/entrar')
  }

  return session
}
