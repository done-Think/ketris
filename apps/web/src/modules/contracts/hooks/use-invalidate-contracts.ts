import { useQueryClient } from '@tanstack/react-query'
import { contractsQueryKeys } from '../config/query-keys'

export function useInvalidateContracts(tenantId: string) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: contractsQueryKeys.tenant(tenantId) }),
      client.invalidateQueries({ queryKey: ['properties'] }),
      client.invalidateQueries({ queryKey: ['crm', 'opportunities', tenantId] }),
      client.invalidateQueries({ queryKey: ['crm', 'properties'] }),
      client.invalidateQueries({ queryKey: ['financial', tenantId] }),
      client.invalidateQueries({ queryKey: ['agenda', tenantId] }),
      client.invalidateQueries({ queryKey: ['maintenance', tenantId] }),
    ])
}
