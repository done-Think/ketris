'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { API_CONTRACT_HEADER, API_CONTRACT_VERSION } from '@shared/config/api-contract'

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
    void fetch('/api/face_check/access', {
      headers: { Authorization: `Bearer ${token}`, [API_CONTRACT_HEADER]: API_CONTRACT_VERSION },
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const result: { allowed?: boolean; candidateVerifications?: boolean } = response.ok
          ? await response.json()
          : {}
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
  return { canManage: ready && access.allowed, hasRequests: ready && access.candidateVerifications }
}
