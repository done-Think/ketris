'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SessionContext, SessionProvider, useSession } from 'next-auth/react'
import type { SessionContextValue, SessionProviderProps } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { PropsWithChildren } from 'react'
import { sessionEndRequestedEvent } from '@shared/lib/auth/session-lifecycle'

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function RecoverSession({
  children,
  context: parent,
  onRecovered,
}: PropsWithChildren<{
  context: SessionContextValue
  onRecovered: (session: Session) => void
}>) {
  const parentUpdate = useRef(parent.update)
  const [snapshot, setSnapshot] = useState<Session | null>(() =>
    parent.data?.refreshToken && !parent.data.authUnavailable ? parent.data : null,
  )
  const previous = useRef<Session | null>(snapshot)
  const [endedToken, setEndedToken] = useState<string | undefined>()
  const pending = useRef<AbortController | null>(null)
  const parentSession = useRef(parent.data)
  const [confirmedEnd, setConfirmedEnd] = useState<{ key: string; source: Session | null } | null>(
    null,
  )
  const [failedUpdate, setFailedUpdate] = useState(false)

  useClientLayoutEffect(() => {
    parentUpdate.current = parent.update
  }, [parent.update])
  useClientLayoutEffect(() => {
    parentSession.current = parent.data
  }, [parent.data])
  useClientLayoutEffect(() => {
    if (
      parent.data?.refreshToken &&
      !parent.data.authUnavailable &&
      parent.data.refreshToken !== endedToken
    ) {
      previous.current = parent.data
      setSnapshot(parent.data)
    }
  }, [parent.data, endedToken])

  const key = snapshot?.refreshToken
  const ended = confirmedEnd?.key === key && parent.data === confirmedEnd?.source
  const recovering = !!key && (!parent.data || failedUpdate) && !ended

  const confirm = useCallback(async (): Promise<Session | null> => {
    const expected = previous.current?.refreshToken
    if (!expected) return null
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) return null
      const body: unknown = await response.json()
      if (controller.signal.aborted || previous.current?.refreshToken !== expected) return null
      if (!body || typeof body !== 'object' || Array.isArray(body)) return null
      if (Object.keys(body).length === 0) {
        setConfirmedEnd({ key: expected, source: parentSession.current })
        return null
      }
      if (
        !('user' in body) ||
        !body.user ||
        typeof body.user !== 'object' ||
        !('id' in body.user) ||
        typeof body.user.id !== 'string' ||
        !('expires' in body) ||
        typeof body.expires !== 'string'
      )
        return null
      if (!('scope' in body) || (body.scope !== 'tenant' && body.scope !== 'platform')) {
        if ('authUnavailable' in body && body.authUnavailable === true) return null
        setConfirmedEnd({ key: expected, source: parentSession.current })
        return null
      }
      if (
        !('accessToken' in body) ||
        typeof body.accessToken !== 'string' ||
        !('refreshToken' in body) ||
        typeof body.refreshToken !== 'string'
      )
        return null
      // This is a fresh, cookie-authenticated /session response, never cached credentials.
      const session = body as Session
      onRecovered(session)
      return session
    } catch {
      return null
    } finally {
      clearTimeout(timer)
      if (pending.current === controller) pending.current = null
    }
  }, [onRecovered])

  useEffect(() => {
    const end = () => {
      setEndedToken(previous.current?.refreshToken)
      previous.current = null
      setSnapshot(null)
      pending.current?.abort()
    }
    window.addEventListener(sessionEndRequestedEvent, end)
    return () => {
      window.removeEventListener(sessionEndRequestedEvent, end)
      pending.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (parent.data?.refreshToken) setConfirmedEnd(null)
    if (recovering) void confirm()
    return () => {
      pending.current?.abort()
    }
  }, [recovering, key, parent.data?.refreshToken, confirm])

  useEffect(() => {
    if (parent.data) setFailedUpdate(false)
  }, [parent.data])

  const update = useCallback<SessionContextValue['update']>(
    async (data) => {
      try {
        const result = await parentUpdate.current(data)
        if (result) return result
      } catch {}
      if (!previous.current) return null
      setFailedUpdate(true)
      return confirm()
    },
    [confirm],
  )
  const value: SessionContextValue =
    recovering && snapshot
      ? {
          status: 'authenticated',
          update,
          data: {
            ...snapshot,
            authUnavailable: true,
            accessToken: undefined,
            refreshToken: undefined,
            scope: undefined,
            tenantId: undefined,
            role: undefined,
            platformRole: undefined,
          },
        }
      : ended && key
        ? { status: 'unauthenticated', data: null, update }
        : { ...parent, update }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

function ObserveSession({ onChange }: { onChange: (context: SessionContextValue) => void }) {
  const context = useSession()
  useEffect(() => onChange(context), [context, onChange])
  return null
}

export function SessionRecoveryProvider({ children, ...props }: SessionProviderProps) {
  const [source, setSource] = useState<SessionContextValue>(() =>
    props.session
      ? { data: props.session, status: 'authenticated', update: async () => null }
      : {
          data: null,
          status: props.session === null ? 'unauthenticated' : 'loading',
          update: async () => null,
        },
  )
  const [seed, setSeed] = useState({ revision: 0, session: props.session, attached: true })
  const recover = useCallback(
    (session: Session) =>
      setSeed((previous) => ({ revision: previous.revision + 1, session, attached: false })),
    [],
  )
  useEffect(() => {
    if (!seed.attached) setSeed((current) => ({ ...current, attached: true }))
  }, [seed.attached])
  return (
    <>
      {seed.attached ? (
        <SessionProvider {...props} key={seed.revision} session={seed.session}>
          <ObserveSession onChange={setSource} />
        </SessionProvider>
      ) : null}
      {/* Only the authentication controller restarts; unsaved application forms stay mounted. */}
      <RecoverSession context={source} onRecovered={recover}>
        {children}
      </RecoverSession>
    </>
  )
}
