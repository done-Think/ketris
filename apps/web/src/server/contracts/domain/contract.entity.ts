import type {
  AdjustmentIndex,
  ContractGuaranteeType,
  ContractPartyRole,
  ContractStatus,
  ContractType,
  SignatureStatus,
} from '../types/contract'

export interface ContractActor {
  id: string
  name: string
}

export interface ContractParty {
  id: string
  userId: string | null
  role: ContractPartyRole
  name: string
  cpf: string
  email: string
  phone: string | null
  signatureStatus: SignatureStatus
  signedAt: Date | null
  signedBy: ContractActor | null
}

export interface ContractDocument {
  id: string
  name: string
  url: string | null
  createdAt: Date
}

export interface Contract {
  id: string
  tenantId: string
  propertyId: string
  opportunityId: string
  code: string
  type: ContractType
  amount: number
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  status: ContractStatus
  activatedAt: Date | null
  activatedBy: ContractActor | null
  createdAt: Date
  updatedAt: Date
  parties: ContractParty[]
  documents: ContractDocument[]
}

export interface NewContractParty {
  role: ContractPartyRole
  name: string
  cpf: string
  email: string
  phone: string | null
}

export interface NewContract {
  tenantId: string
  opportunityId: string
  type: ContractType
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  parties: NewContractParty[]
}

// Limits contract access to properties the actor is responsible for (AGENT).
export interface ContractAccessScope {
  responsibleId?: string
}

export interface ContractListFilters {
  tenantId: string
  status?: ContractStatus
  type?: ContractType
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface ContractListItem {
  id: string
  code: string
  opportunityId: string
  propertyId: string
  propertyTitle: string
  propertyAddress: string
  ownerName: string | null
  tenantName: string | null
  status: ContractStatus
  type: ContractType
  amount: number
  startDate: Date
  endDate: Date
  updatedAt: Date
}

export interface ContractListResult {
  items: ContractListItem[]
  totalCount: number
}

export interface EligibleOpportunity {
  id: string
  propertyId: string
  status: string
  hasContract: boolean
}
