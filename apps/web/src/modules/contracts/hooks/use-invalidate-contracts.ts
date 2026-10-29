import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useQueryClient } from '@tanstack/react-query'
import { contractsQueryKeys } from '../config/query-keys'

export function useInvalidateContracts() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
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
