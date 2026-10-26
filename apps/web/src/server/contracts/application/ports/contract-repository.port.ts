import type { Contract } from '../../domain/contract.entity'
import type { ContractManualSignatureEvidence } from '../../types/workflow'
import type {
  ContractListFilters,
  ContractListResult,
  ContractManageScope,
  ContractReadScope,
  EligibleOpportunity,
  NewContract,
} from '../../types/contract-entity'

export interface ContractRepository {
  findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
    scope: ContractManageScope,
  ): Promise<EligibleOpportunity | null>
  create(input: NewContract, scope: ContractManageScope): Promise<Contract>
  findMany(filters: ContractListFilters, scope: ContractReadScope): Promise<ContractListResult>
  findById(contractId: string, scope: ContractReadScope): Promise<Contract | null>
  signParty(
    tenantId: string,
    contractId: string,
    partyId: string,
    actorId: string,
    evidence: ContractManualSignatureEvidence,
    scope: ContractManageScope,
  ): Promise<Contract>
}
