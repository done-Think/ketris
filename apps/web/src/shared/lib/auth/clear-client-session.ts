'use client'

import { signOut } from 'next-auth/react'

export async function clearClientSession(): Promise<void> {
  try {
    window.localStorage.clear()
  } catch {}

  try {
    window.sessionStorage.clear()
  } catch {}

  await signOut({ redirect: false })
}
