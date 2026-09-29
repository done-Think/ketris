import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { contractsService } from '../services/contracts-service'
import type { ContractListFilters } from '../types/service'
import type { CreateContractFormValues } from '../types/contract'
import { buildCreateContractPayload } from '../utils/contract-adapter'

function normalizeFilters(filters: ContractListFilters) {
  return {
    status: filters.status ?? null,
    type: filters.type ?? null,
    propertyId: filters.propertyId ?? null,
    search: filters.search ?? null,
    page: filters.page ?? null,
    pageSize: filters.pageSize ?? null,
  }
}

export const contractsQueryKeys = {
  all: ['contracts'] as const,
  tenant: (tenantId: string) => [...contractsQueryKeys.all, tenantId] as const,
  lists: (tenantId: string) => [...contractsQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: ContractListFilters = {}) =>
    [...contractsQueryKeys.lists(tenantId), normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...contractsQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, contractId: string) =>
    [...contractsQueryKeys.details(tenantId), contractId] as const,
}

export function useContracts(
  tenantId: string | null | undefined,
  filters: ContractListFilters = {},
) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: contractsQueryKeys.list(scopedTenantId, filters),
    queryFn: () => contractsService.list(filters),
    enabled: Boolean(tenantId),
  })
}

export function useContract(
  tenantId: string | null | undefined,
  contractId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedContractId = contractId ?? ''

  return useQuery({
    queryKey: contractsQueryKeys.detail(scopedTenantId, scopedContractId),
    queryFn: () => contractsService.get(scopedContractId),
    enabled: Boolean(tenantId) && Boolean(contractId),
  })
}

export function useCreateContract(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (values: CreateContractFormValues) =>
      contractsService.create(buildCreateContractPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.lists(scopedTenantId) })
    },
  })
}

export function useSignContractParty(tenantId: string | null | undefined, contractId: string) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (partyId: string) => contractsService.signParty(contractId, partyId),
    onSuccess: (contract) => {
      queryClient.setQueryData(contractsQueryKeys.detail(scopedTenantId, contractId), contract)
      queryClient.invalidateQueries({ queryKey: contractsQueryKeys.lists(scopedTenantId) })
    },
  })
}
