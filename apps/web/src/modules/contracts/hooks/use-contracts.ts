import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useMutation, useQuery } from '@tanstack/react-query'
import { contractsService } from '../services/contracts-service'
import { contractsQueryKeys } from '../config/query-keys'
import type { ContractListFilters, EditContractPayload } from '../types/service'
import type { CreateContractFormValues } from '../types/contract'
import { buildCreateContractPayload } from '../utils/contract-adapter'
import type {
  ContractSignMutationInput,
  ContractTransitionMutationInput,
  ContractLinkMutationInput,
} from '../types/workflow'
import { useInvalidateContracts } from './use-invalidate-contracts'

export { contractsQueryKeys } from '../config/query-keys'

export function useContracts(filters: ContractListFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const session = scope.session
  return useQuery({
    queryKey: contractsQueryKeys.list(tenantId, session?.user?.id, session?.role, filters),
    queryFn: () => contractsService.list(filters),
    enabled: scope.enabled,
  })
}

export function useContract(contractId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const session = scope.session
  return useQuery({
    queryKey: contractsQueryKeys.detail(
      tenantId,
      session?.user?.id,
      session?.role,
      contractId ?? '',
    ),
    queryFn: () => contractsService.get(contractId ?? ''),
    enabled: scope.enabled && Boolean(contractId),
  })
}

export function useCreateContract() {
  const invalidate = useInvalidateContracts()
  return useMutation({
    mutationFn: (values: CreateContractFormValues) =>
      contractsService.create(buildCreateContractPayload(values)),
    onSuccess: invalidate,
  })
}

export function useSignContractParty(contractId: string) {
  const invalidate = useInvalidateContracts()
  return useMutation({
    mutationFn: ({ partyId, documentId }: ContractSignMutationInput) =>
      contractsService.signParty(contractId, partyId, { documentId }),
    onSuccess: invalidate,
  })
}

export function useEditContract(contractId: string) {
  const invalidate = useInvalidateContracts()
  return useMutation({
    mutationFn: (payload: EditContractPayload) => contractsService.edit(contractId, payload),
    onSuccess: invalidate,
  })
}

export function useTransitionContract(contractId: string) {
  const invalidate = useInvalidateContracts()
  return useMutation({
    mutationFn: ({ action, reason }: ContractTransitionMutationInput) =>
      contractsService.transition(contractId, action, reason),
    onSuccess: invalidate,
  })
}

export function useLinkContractParty(contractId: string) {
  const invalidate = useInvalidateContracts()
  return useMutation({
    mutationFn: ({ partyId, email }: ContractLinkMutationInput) =>
      contractsService.linkParty(contractId, partyId, email),
    onSuccess: invalidate,
  })
}

export function useContractHistory(contractId: string, page: number, enabled: boolean) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const session = scope.session
  return useQuery({
    queryKey: [
      ...contractsQueryKeys.actor(tenantId, session?.user?.id, session?.role),
      'history',
      contractId,
      page,
    ],
    queryFn: () => contractsService.history(contractId, page),
    enabled: enabled && scope.enabled && Boolean(contractId),
  })
}
