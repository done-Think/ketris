'use client'

import { canConnectInstagram } from '@shared/lib/auth/instagram-access'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { instagramService } from '@shared/lib/api/instagram-service'

export function useInstagramConnection() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['instagram-connection', session?.tenantId, session?.user?.id, session?.role],
    queryFn: () => instagramService.connection(),
    enabled: canConnectInstagram(session?.role) && Boolean(session?.tenantId),
  })
}

export function useInstagramPublications(propertyId: string, enabled: boolean) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      'instagram-publications',
      session?.tenantId,
      session?.user?.id,
      session?.role,
      propertyId,
    ],
    queryFn: () => instagramService.publications(propertyId),
    enabled: enabled && canConnectInstagram(session?.role) && Boolean(session?.tenantId),
    refetchInterval: (query) =>
      query.state.data?.publications.some((p) =>
        ['QUEUED', 'PREPARING', 'READY', 'PUBLISHING', 'VERIFYING'].includes(p.status),
      )
        ? 5000
        : false,
  })
}

export function useDisconnectInstagram() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => instagramService.disconnect(),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['instagram-connection'] })
      await client.invalidateQueries({ queryKey: ['instagram-publications'] })
    },
  })
}
