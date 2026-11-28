'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { isAxiosError } from 'axios'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { useTenantStore } from '@shared/stores/tenant-store'
import type { RefreshTokenResponse } from '@shared/types'

import { httpClient } from './http-client'

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useHttpClientSessionSync() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const setTenant = useTenantStore((state) => state.setTenant)
  const clearTenant = useTenantStore((state) => state.clearTenant)
  const currentSession = useRef(session)
  const lifecycle = useRef(0)

  useClientLayoutEffect(() => {
    lifecycle.current += 1
    return () => {
      lifecycle.current += 1
    }
  }, [])

  useClientLayoutEffect(() => {
    currentSession.current = session
  }, [session])

  useClientLayoutEffect(() => {
    httpClient.setAuthUnavailable(session?.authUnavailable === true)
    httpClient.setAuthToken(session?.authUnavailable ? null : (session?.accessToken ?? null))
  }, [session?.accessToken, session?.authUnavailable])

  useClientLayoutEffect(() => {
    const tenantId = session?.tenantId ?? null
    httpClient.setTenant(tenantId)

    if (tenantId) {
      setTenant(tenantId)
      return
    }

    clearTenant()
  }, [clearTenant, session?.tenantId, setTenant])

  useClientLayoutEffect(() => {
    const generation = lifecycle.current
    const isActive = () => lifecycle.current === generation
    const currentRefreshToken = session?.refreshToken
    const isPlatform = session?.scope === 'platform'
    const loginPath = isPlatform ? '/platform/login' : '/login'

    httpClient.setUnauthorizedHandler(async () => {
      if (!isActive() || session?.authUnavailable) return null
      if (!currentRefreshToken) {
        await clearClientSession()
        if (!isActive()) return null
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

        if (!isActive() || currentSession.current?.refreshToken !== currentRefreshToken) return null
        const updatedSession = await update(tokens)
        if (
          !isActive() ||
          currentSession.current?.user?.id !== session?.user?.id ||
          currentSession.current?.tenantId !== session?.tenantId ||
          currentSession.current?.scope !== session?.scope
        )
          return null
        if (updatedSession?.authUnavailable) {
          httpClient.setAuthUnavailable(true)
          httpClient.setAuthToken(null)
          return null
        }
        if (updatedSession?.accessToken !== tokens.accessToken) return null
        httpClient.setAuthToken(tokens.accessToken)

        return tokens.accessToken
      } catch (error) {
        if (!isActive() || currentSession.current?.refreshToken !== currentRefreshToken) return null
        const status = isAxiosError(error) ? error.response?.status : undefined
        if (status !== 401 && status !== 403) return null
        await clearClientSession()
        if (!isActive()) return null
        router.replace(loginPath)
        router.refresh()
        return null
      }
    })

    return () => httpClient.setUnauthorizedHandler(null)
  }, [
    router,
    session?.refreshToken,
    session?.scope,
    session?.tenantId,
    session?.user?.id,
    session?.authUnavailable,
    update,
  ])
}
