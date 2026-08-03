'use client'

import { useHttpClientSessionSync } from '@shared/lib/api/use-http-client-session-sync'

export function HttpClientSessionBridge() {
  useHttpClientSessionSync()
  return null
}
