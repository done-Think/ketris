import type {
  AdjustmentIndex,
  ContractGuaranteeType,
  ContractPartyRole,
  ContractStatus,
  ContractType,
  SignatureStatus,
} from './contract'

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
  signatureMethod: 'MANUAL' | 'PROVIDER' | null
  signatureDocumentId: string | null
  signatureDocumentHash: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface ContractDocument {
  id: string
  name: string
  url: string | null
  createdAt: Date
  updatedAt: Date | null
  sha256: string | null
  size: number | null
  uploadedBy: ContractActor | null
  contractRevision: number | null
  canDownload: boolean
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
  actorId: string
  opportunityId: string
  amount?: number
  type: ContractType
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  parties: NewContractParty[]
}

export interface ContractManageScope {
  responsibleId?: string
}

export type ContractReadScope =
  | ({ kind: 'tenant'; tenantId: string } & ContractManageScope)
  | { kind: 'party'; userId: string }
  | { kind: 'propertyOwner'; tenantId: string; ownerId: string }

export interface ContractListFilters {
  status?: ContractStatus
  type?: ContractType
  propertyId?: string
  search?: string
  period?: 'ALL' | 'THIS_MONTH' | 'NEXT_90_DAYS'
  sortBy?: 'property' | 'tenant' | 'amount' | 'startDate' | 'endDate' | 'status' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  locale?: 'pt-BR' | 'en-US' | 'es-ES'
  page?: number
  pageSize?: number
}

export interface ContractListItem {
  canEdit: boolean
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
  summary: ContractListSummary
}

export interface EligibleOpportunity {
  id: string
  propertyId: string
  status: string
  hasContract: boolean
}

export interface ContractPropertySummary {
  title: string
  address: string
}

export interface ContractListSummary {
  total: number
  active: number
  expiring30: number
  expiring90: number
  closed: number
}
