'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

import { useTenantStore } from '@shared/stores/tenant-store'

import { httpClient } from './http-client'

export function useHttpClientSessionSync() {
  const { data: session } = useSession()
  const setTenant = useTenantStore((state) => state.setTenant)
  const clearTenant = useTenantStore((state) => state.clearTenant)

  useEffect(() => {
    const tenantId = session?.tenantId ?? null
    httpClient.setTenant(tenantId)

    if (tenantId) {
      setTenant(tenantId)
      return
    }

    clearTenant()
  }, [clearTenant, session?.tenantId, setTenant])
}
