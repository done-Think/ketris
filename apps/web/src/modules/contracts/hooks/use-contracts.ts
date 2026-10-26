import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
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

export function useContracts(
  tenantId: string | null | undefined,
  filters: ContractListFilters = {},
) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: contractsQueryKeys.list(tenantId ?? '', session?.user?.id, session?.role, filters),
    queryFn: () => contractsService.list(filters),
    enabled: Boolean(tenantId && session?.user?.id && session?.role),
  })
}

export function useContract(
  tenantId: string | null | undefined,
  contractId: string | null | undefined,
) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: contractsQueryKeys.detail(
      tenantId ?? '',
      session?.user?.id,
      session?.role,
      contractId ?? '',
    ),
    queryFn: () => contractsService.get(contractId ?? ''),
    enabled: Boolean(tenantId && contractId && session?.user?.id && session?.role),
  })
}

export function useCreateContract(tenantId: string | null | undefined) {
  const invalidate = useInvalidateContracts(tenantId ?? '')
  return useMutation({
    mutationFn: (values: CreateContractFormValues) =>
      contractsService.create(buildCreateContractPayload(values)),
    onSuccess: invalidate,
  })
}

export function useSignContractParty(tenantId: string | null | undefined, contractId: string) {
  const invalidate = useInvalidateContracts(tenantId ?? '')
  return useMutation({
    mutationFn: ({ partyId, documentId }: ContractSignMutationInput) =>
      contractsService.signParty(contractId, partyId, { documentId }),
    onSuccess: invalidate,
  })
}

export function useEditContract(tenantId: string, contractId: string) {
  const invalidate = useInvalidateContracts(tenantId)
  return useMutation({
    mutationFn: (payload: EditContractPayload) => contractsService.edit(contractId, payload),
    onSuccess: invalidate,
  })
}

export function useTransitionContract(tenantId: string, contractId: string) {
  const invalidate = useInvalidateContracts(tenantId)
  return useMutation({
    mutationFn: ({ action, reason }: ContractTransitionMutationInput) =>
      contractsService.transition(contractId, action, reason),
    onSuccess: invalidate,
  })
}

export function useLinkContractParty(tenantId: string, contractId: string) {
  const invalidate = useInvalidateContracts(tenantId)
  return useMutation({
    mutationFn: ({ partyId, email }: ContractLinkMutationInput) =>
      contractsService.linkParty(contractId, partyId, email),
    onSuccess: invalidate,
  })
}

export function useContractHistory(
  tenantId: string,
  contractId: string,
  page: number,
  enabled: boolean,
) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      ...contractsQueryKeys.actor(tenantId, session?.user?.id, session?.role),
      'history',
      contractId,
      page,
    ],
    queryFn: () => contractsService.history(contractId, page),
    enabled: enabled && Boolean(tenantId && contractId && session?.user?.id && session?.role),
  })
}
