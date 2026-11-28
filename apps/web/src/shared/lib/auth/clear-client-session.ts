'use client'

import { getSession, signOut } from 'next-auth/react'
import { httpClient } from '@shared/lib/api/http-client'
import { notifySessionEndRequested } from './session-lifecycle'

export async function clearClientSession(): Promise<void> {
  notifySessionEndRequested()
  try {
    const session = await getSession()

    if (session?.scope) {
      await httpClient.post('/session/logout', undefined, { skipUnauthorizedHandling: true })
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
