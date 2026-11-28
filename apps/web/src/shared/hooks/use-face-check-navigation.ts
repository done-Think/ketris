'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { httpClient } from '@shared/lib/api/http-client'

export function useFaceCheckNavigation() {
  const { data: session, status } = useSession()
  const token = session?.accessToken
  const scope = `${session?.tenantId ?? ''}:${session?.user?.id ?? ''}:${session?.role ?? ''}`
  const eligible =
    status === 'authenticated' && session?.scope === 'tenant' && !session.authUnavailable && !!token
  const [access, setAccess] = useState({ scope: '', allowed: false, candidateVerifications: false })

  useEffect(() => {
    if (!eligible || !token) return
    const controller = new AbortController()
    void httpClient
      .get<{ allowed?: boolean; candidateVerifications?: boolean }>('/face_check/access', {
        headers: { Authorization: `Bearer ${token}` },
        sessionAccessToken: token,
        signal: controller.signal,
      })
      .then((result) => {
        if (!controller.signal.aborted)
          setAccess({
            scope,
            allowed: result.allowed === true,
            candidateVerifications: result.candidateVerifications === true,
          })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAccess({ scope, allowed: false, candidateVerifications: false })
      })
    return () => controller.abort()
  }, [eligible, token, scope])

  const ready = eligible && access.scope === scope
  return {
    canManage: ready && access.allowed,
    hasRequests: ready && access.candidateVerifications,
    isLoading: eligible && !ready,
  }
}
