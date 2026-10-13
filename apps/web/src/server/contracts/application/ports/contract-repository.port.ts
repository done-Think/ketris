import type {
  Contract,
  ContractListFilters,
  ContractListResult,
  EligibleOpportunity,
  NewContract,
} from '../../domain/contract.entity'

export interface ContractRepository {
  findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
  ): Promise<EligibleOpportunity | null>
  create(input: NewContract): Promise<Contract>
  findMany(filters: ContractListFilters): Promise<ContractListResult>
  findById(tenantId: string, contractId: string): Promise<Contract | null>
  signParty(tenantId: string, contractId: string, partyId: string): Promise<Contract>
}
