import type { ContractOpportunity } from '../types/service'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { contractsQueryKeys } from '../config/query-keys'
import { contractsService } from '../services/contracts-service'

export function useContractOpportunities(search: string) {
  const { data: session } = useSession()
  return useInfiniteQuery({
    queryKey: [
      ...contractsQueryKeys.actor(session?.tenantId ?? '', session?.user?.id, session?.role),
      'opportunities',
      search,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      contractsService.opportunities({ search, page: pageParam, pageSize: 25 }),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    enabled: Boolean(session?.tenantId && session?.user?.id && session?.role),
  })
}

export function useContractOpportunitySelection(
  opportunityId: string,
  options: ContractOpportunity[],
) {
  const client = useQueryClient()
  const { data: session } = useSession()
  const actor = contractsQueryKeys.actor(session?.tenantId ?? '', session?.user?.id, session?.role)
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
