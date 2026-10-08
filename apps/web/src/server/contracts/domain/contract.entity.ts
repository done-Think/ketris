export type ContractStatus =
  | 'RASCUNHO'
  | 'EM_REVISAO'
  | 'AGUARDANDO_ASSINATURA'
  | 'ASSINADO'
  | 'ATIVO'
  | 'ENCERRADO'
  | 'CANCELADO'

export type ContractType = 'RESIDENCIAL' | 'COMERCIAL' | 'TEMPORADA'

export type AdjustmentIndex = 'IPCA' | 'IGPM' | 'INPC'

export type ContractGuaranteeType = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'TITULO_CAPITALIZACAO'

export type ContractPartyRole = 'LOCADOR' | 'LOCATARIO' | 'FIADOR'

export type SignatureStatus = 'PENDENTE' | 'ASSINADA'

export interface ContractParty {
  id: string
  role: ContractPartyRole
  name: string
  cpf: string
  email: string
  phone: string | null
  signatureStatus: SignatureStatus
  signedAt: Date | null
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
