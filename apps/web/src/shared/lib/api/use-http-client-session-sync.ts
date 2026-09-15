'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { useTenantStore } from '@shared/stores/tenant-store'

import { httpClient } from './http-client'

type RefreshTokenResponse = {
  accessToken: string
  refreshToken: string
}

export function useHttpClientSessionSync() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const setTenant = useTenantStore((state) => state.setTenant)
  const clearTenant = useTenantStore((state) => state.clearTenant)

  useEffect(() => {
    httpClient.setAuthToken(session?.accessToken ?? null)
  }, [session?.accessToken])

  useEffect(() => {
    const tenantId = session?.tenantId ?? null
    httpClient.setTenant(tenantId)

    if (tenantId) {
      setTenant(tenantId)
      return
    }

    clearTenant()
  }, [clearTenant, session?.tenantId, setTenant])

  useEffect(() => {
    const currentRefreshToken = session?.refreshToken

    httpClient.setUnauthorizedHandler(async () => {
      if (!currentRefreshToken) {
        await clearClientSession()
        router.replace('/login')
        router.refresh()
        return null
      }

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        })

        if (!response.ok) throw new Error('refresh failed')

        const tokens = (await response.json()) as RefreshTokenResponse

        await update(tokens)
        httpClient.setAuthToken(tokens.accessToken)

        return tokens.accessToken
      } catch {
        await clearClientSession()
        router.replace('/login')
        router.refresh()
        return null
      }
    })

    return () => httpClient.setUnauthorizedHandler(null)
  }, [router, session?.refreshToken, update])
}
