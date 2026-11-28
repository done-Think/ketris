'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import { isAxiosError } from 'axios'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { useTenantStore } from '@shared/stores/tenant-store'
import type { RefreshTokenResponse } from '@shared/types'

import { httpClient } from './http-client'

const MAX_KNOWN_ACCESS_TOKENS = 5

type SessionTokens = {
  identity: string
  accessToken?: string
  refreshToken?: string
  accessTokens: string[]
}

function identityOf(session: Session | null | undefined): string {
  return `${session?.scope ?? ''}:${session?.tenantId ?? ''}:${session?.user?.id ?? ''}`
}

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useHttpClientSessionSync() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const setTenant = useTenantStore((state) => state.setTenant)
  const clearTenant = useTenantStore((state) => state.clearTenant)
  const currentSession = useRef(session)
  const lifecycle = useRef(0)
  const tokens = useRef<SessionTokens>({ identity: identityOf(session), accessTokens: [] })

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
    if (!session || session.authUnavailable) return
    const identity = identityOf(session)
    const known = tokens.current
    const accessTokens = known.identity === identity ? [...known.accessTokens] : ([] as string[])
    if (session.accessToken && !accessTokens.includes(session.accessToken))
      accessTokens.push(session.accessToken)
    tokens.current = {
      identity,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessTokens: accessTokens.slice(-MAX_KNOWN_ACCESS_TOKENS),
    }
  }, [session])

  useClientLayoutEffect(() => {
    const generation = lifecycle.current
    const isActive = () => lifecycle.current === generation
    const isPlatform = session?.scope === 'platform'
    const loginPath = isPlatform ? '/platform/login' : '/login'

    httpClient.setUnauthorizedHandler(async (failedAccessToken) => {
      if (!isActive() || currentSession.current?.authUnavailable) return null
      const started = tokens.current
      if (
        failedAccessToken &&
        started.accessToken &&
        failedAccessToken !== started.accessToken &&
        started.accessTokens.includes(failedAccessToken)
      )
        return started.accessToken

      const usedRefreshToken = started.refreshToken
      if (!usedRefreshToken) {
        await clearClientSession()
        if (!isActive()) return null
        router.replace(loginPath)
        router.refresh()
        return null
      }

      try {
        const refreshed = await httpClient.post<RefreshTokenResponse>(
          isPlatform ? '/platform/refresh' : '/auth/refresh',
          { refreshToken: usedRefreshToken },
          { skipUnauthorizedHandling: true },
        )

        if (!isActive() || tokens.current.refreshToken !== usedRefreshToken) return null
        const updatedSession = await update(refreshed)
        if (!isActive() || tokens.current.identity !== started.identity) return null
        if (updatedSession?.authUnavailable) {
          httpClient.setAuthUnavailable(true)
          httpClient.setAuthToken(null)
          return null
        }
        if (updatedSession?.accessToken !== refreshed.accessToken) return null
        tokens.current = {
          identity: started.identity,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accessTokens: [...tokens.current.accessTokens, refreshed.accessToken].slice(
            -MAX_KNOWN_ACCESS_TOKENS,
          ),
        }
        httpClient.setAuthToken(refreshed.accessToken)

        return refreshed.accessToken
      } catch (error) {
        if (!isActive() || tokens.current.identity !== started.identity) return null
        if (tokens.current.refreshToken !== usedRefreshToken)
          return tokens.current.accessToken ?? null
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
  }, [router, session?.scope, update])
}
