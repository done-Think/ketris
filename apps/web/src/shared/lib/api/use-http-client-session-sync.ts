'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { isAxiosError } from 'axios'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { useTenantStore } from '@shared/stores/tenant-store'
import type { RefreshTokenResponse } from '@shared/types'

import { httpClient } from './http-client'

export function useHttpClientSessionSync() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const setTenant = useTenantStore((state) => state.setTenant)
  const clearTenant = useTenantStore((state) => state.clearTenant)

  useEffect(() => {
    httpClient.setAuthUnavailable(session?.authUnavailable === true)
    httpClient.setAuthToken(session?.authUnavailable ? null : (session?.accessToken ?? null))
  }, [session?.accessToken, session?.authUnavailable])

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
    const isPlatform = session?.scope === 'platform'
    const loginPath = isPlatform ? '/platform/login' : '/login'

    httpClient.setUnauthorizedHandler(async () => {
      if (session?.authUnavailable) return null
      if (!currentRefreshToken) {
        await clearClientSession()
        router.replace(loginPath)
        router.refresh()
        return null
      }

      try {
        const tokens = await httpClient.post<RefreshTokenResponse>(
          isPlatform ? '/platform/refresh' : '/auth/refresh',
          { refreshToken: currentRefreshToken },
          { skipUnauthorizedHandling: true },
        )

        const updatedSession = await update(tokens)
        if (updatedSession?.authUnavailable) {
          httpClient.setAuthUnavailable(true)
          httpClient.setAuthToken(null)
          return null
        }
        if (updatedSession?.accessToken !== tokens.accessToken) return null
        httpClient.setAuthToken(tokens.accessToken)

        return tokens.accessToken
      } catch (error) {
        const status = isAxiosError(error) ? error.response?.status : undefined
        if (status !== 401 && status !== 403) return null
        await clearClientSession()
        router.replace(loginPath)
        router.refresh()
        return null
      }
    })

    return () => httpClient.setUnauthorizedHandler(null)
  }, [router, session?.refreshToken, session?.scope, session?.authUnavailable, update])
}
