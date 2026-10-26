import type {
  ContractPartyLinkWork,
  ContractPartyLinkView,
  ContractPartyLinkScope,
} from '../../types/contract-party-link-transaction'
import type { AuditedContractPartyUserLinkData } from '../../types/contract-party-user-link'
import type { ContractRenterCandidate } from '../../types/contract-renter-link'

export interface ContractPartyLinkRepository {
  findById(contractId: string, scope: ContractPartyLinkScope): Promise<ContractPartyLinkView | null>
  linkPartyUser(input: AuditedContractPartyUserLinkData): Promise<boolean>
}

export interface ContractPartyLinkUsers {
  findManyByEmail(email: string): Promise<ContractRenterCandidate[]>
  findById(userId: string): Promise<ContractRenterCandidate | null>
}

export interface ContractPartyLinkTransaction {
  run<T>(work: ContractPartyLinkWork<T>): Promise<T>
}
