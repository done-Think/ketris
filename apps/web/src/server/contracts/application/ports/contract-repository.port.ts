import type {
  Contract,
  ContractAccessScope,
  ContractListFilters,
  ContractListResult,
  EligibleOpportunity,
  NewContract,
} from '../../domain/contract.entity'

export interface ContractRepository {
  findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
    scope: ContractAccessScope,
  ): Promise<EligibleOpportunity | null>
  create(input: NewContract): Promise<Contract>
  findMany(filters: ContractListFilters, scope: ContractAccessScope): Promise<ContractListResult>
  findById(
    tenantId: string,
    contractId: string,
    scope: ContractAccessScope,
  ): Promise<Contract | null>
  signParty(
    tenantId: string,
    contractId: string,
    partyId: string,
    actorId: string,
  ): Promise<Contract>
}
