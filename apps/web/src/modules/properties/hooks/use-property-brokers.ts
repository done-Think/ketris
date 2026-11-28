import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { propertiesService } from '../services/properties-service'
import { propertyQueryKeys } from './use-properties'

export function usePropertyBrokers() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      ...propertyQueryKeys.all,
      'brokers',
      session?.tenantId,
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => propertiesService.listBrokers(),
    enabled: Boolean(session?.tenantId) && session?.role === 'OWNER',
  })
}
