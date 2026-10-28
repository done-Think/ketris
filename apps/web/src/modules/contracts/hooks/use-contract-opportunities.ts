import type { ContractOpportunity } from '../types/service'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { contractsQueryKeys } from '../config/query-keys'
import { contractsService } from '../services/contracts-service'

export function useContractOpportunities(search: string) {
  const scope = useTenantSessionScope()
  return useInfiniteQuery({
    queryKey: [
      ...contractsQueryKeys.actor(scope.tenantId, scope.userId, scope.role),
      'opportunities',
      search,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      contractsService.opportunities({ search, page: pageParam, pageSize: 25 }),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    enabled: scope.enabled,
  })
}

export function useContractOpportunitySelection(
  opportunityId: string,
  options: ContractOpportunity[],
) {
  const client = useQueryClient()
  const scope = useTenantSessionScope()
  const actor = contractsQueryKeys.actor(scope.tenantId, scope.userId, scope.role)
  const selected =
    options.find((item) => item.id === opportunityId) ??
    client.getQueryData<ContractOpportunity>([...actor, 'opportunity', opportunityId]) ??
    null
  return {
    selected,
    remember: (opportunity: ContractOpportunity) =>
      client.setQueryData([...actor, 'opportunity', opportunity.id], opportunity),
  }
}
