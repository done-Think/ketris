import type {
  ContractPartyLinkRepository,
  ContractPartyLinkUsers,
} from '../application/ports/contract-party-link-transaction.port'
import type { RenterParty } from './contract-renter-link'

export interface ContractPartyLinkView {
  id: string
  parties: (RenterParty & { id: string })[]
}

export interface ContractPartyLinkScope {
  kind: 'tenant'
  tenantId: string
}

export interface ContractPartyLinkDependencies {
  contracts: ContractPartyLinkRepository
  users: ContractPartyLinkUsers
}

export type ContractPartyLinkWork<T> = (dependencies: ContractPartyLinkDependencies) => Promise<T>
