'use client'

import { getSession, signOut } from 'next-auth/react'

export async function clearClientSession(): Promise<void> {
  try {
    const session = await getSession()

    if (session?.scope === 'tenant' && session.refreshToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
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
