import type { Papel } from '@server/auth/domain/user.entity'
import type { ContractManualSignatureEvidence } from './workflow'
import type { ContractListFilters, NewContractParty } from './contract-entity'
import type { AdjustmentIndex, ContractGuaranteeType, ContractType } from './contract'

export interface CreateContractFromOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
  amount?: number
  type: ContractType
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  owner: Omit<NewContractParty, 'role'>
  tenant: Omit<NewContractParty, 'role'>
  guarantor: Omit<NewContractParty, 'role'> | null
}

export interface GetContractInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contractId: string
}

export interface ListContractsInput extends ContractListFilters {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}

export interface SignContractPartyInput extends ContractManualSignatureEvidence {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contractId: string
  partyId: string
}
