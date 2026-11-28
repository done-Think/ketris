'use client'

import { getSession, signOut } from 'next-auth/react'
import { httpClient } from '@shared/lib/api/http-client'
import { reportLogoutRevocationFailure } from '@shared/lib/telemetry/session-telemetry'
import { notifyLocalOnlyLogout, notifySessionEndRequested } from './session-lifecycle'

const sessionKeyPrefixes = ['nextauth.']
const userDraftKeyPrefixes = ['maintenance-draft:']

type ClearClientSessionOptions = { reason: 'manual' | 'forced' }

function removeStoredKeys(...prefixGroups: string[][]) {
  const prefixes = prefixGroups.flat()
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[storageName]
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      for (const key of keys) {
        if (key && prefixes.some((prefix) => key.startsWith(prefix))) storage.removeItem(key)
      }
    } catch {}
  }
}

export async function clearClientSession({ reason }: ClearClientSessionOptions): Promise<void> {
  notifySessionEndRequested()
  try {
    const session = await getSession()

    if (session?.scope) {
      await httpClient.post('/session/logout', undefined, { skipUnauthorizedHandling: true })
    }
  } catch (error) {
    reportLogoutRevocationFailure(error)
    notifyLocalOnlyLogout()
  }

  removeStoredKeys(sessionKeyPrefixes, reason === 'manual' ? userDraftKeyPrefixes : [])

  await signOut({ redirect: false })
}
