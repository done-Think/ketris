'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

import { useRouter } from '@/i18n/navigation'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { useTenantStore } from '@shared/stores/tenant-store'

import { httpClient } from './http-client'

const MAX_KNOWN_ACCESS_TOKENS = 5
const REFRESH_LOCK_NAME = 'ketris-session-refresh'

type SessionTokens = {
  identity: string
  accessToken?: string
  accessTokens: string[]
}

function identityOf(session: Session | null | undefined): string {
  return `${session?.scope ?? ''}:${session?.tenantId ?? ''}:${session?.user?.id ?? ''}`
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  return locks ? await locks.request(REFRESH_LOCK_NAME, task) : task()
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
      accessTokens: accessTokens.slice(-MAX_KNOWN_ACCESS_TOKENS),
    }
  }, [session])

  useClientLayoutEffect(() => {
    const generation = lifecycle.current
    const isActive = () => lifecycle.current === generation
    const isPlatform = session?.scope === 'platform'
    const loginPath = isPlatform ? '/platform/login' : '/login'
    const endSession = async () => {
      await clearClientSession()
      if (!isActive()) return
      router.replace(loginPath)
      router.refresh()
    }

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

      if (!started.accessToken) {
        await endSession()
        return null
      }

      try {
        const updatedSession = await withRefreshLock(() => update({ refresh: true }))
        if (!isActive() || tokens.current.identity !== started.identity) return null
        if (!updatedSession) return null
        if (updatedSession.authUnavailable) {
          httpClient.setAuthUnavailable(true)
          httpClient.setAuthToken(null)
          return null
        }
        if (!updatedSession.accessToken) {
          if (tokens.current.accessToken !== started.accessToken)
            return tokens.current.accessToken ?? null
          await endSession()
          return null
        }
        if (updatedSession.accessToken === started.accessToken) return null
        tokens.current = {
          identity: started.identity,
          accessToken: updatedSession.accessToken,
          accessTokens: [...tokens.current.accessTokens, updatedSession.accessToken].slice(
            -MAX_KNOWN_ACCESS_TOKENS,
          ),
        }
        httpClient.setAuthToken(updatedSession.accessToken)

        return updatedSession.accessToken
      } catch {
        return null
      }
    })

    return () => httpClient.setUnauthorizedHandler(null)
  }, [router, session?.scope, update])
}
