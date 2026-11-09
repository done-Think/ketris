'use client'

import { getSession, signOut } from 'next-auth/react'
import { httpClient } from '@shared/lib/api/http-client'
import { notifySessionEndRequested } from './session-lifecycle'

export async function clearClientSession(): Promise<void> {
  notifySessionEndRequested()
  try {
    const session = await getSession()

    if (session?.scope && session.refreshToken) {
      const endpoint = session.scope === 'platform' ? '/platform/logout' : '/auth/logout'
      await httpClient.post(
        endpoint,
        { refreshToken: session.refreshToken },
        { skipUnauthorizedHandling: true },
      )
    }
  } catch {}

  try {
    window.localStorage.clear()
  } catch {}

  try {
    window.sessionStorage.clear()
  } catch {}

  await signOut({ redirect: false })
}
