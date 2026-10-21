import type {
  Contract,
  ContractListFilters,
  ContractListResult,
  ContractManageScope,
  ContractReadScope,
  EligibleOpportunity,
  NewContract,
} from '../../domain/contract.entity'
import type { LinkContractPartyUserData } from '../../types/contract-party-user-link'

export interface ContractRepository {
  findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
    scope: ContractManageScope,
  ): Promise<EligibleOpportunity | null>
  create(input: NewContract): Promise<Contract>
  findMany(filters: ContractListFilters, scope: ContractReadScope): Promise<ContractListResult>
  findById(contractId: string, scope: ContractReadScope): Promise<Contract | null>
  signParty(
    tenantId: string,
    contractId: string,
    partyId: string,
    actorId: string,
  ): Promise<Contract>
  linkPartyUser(input: LinkContractPartyUserData): Promise<boolean>
}
