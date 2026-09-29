export type ApiContractStatus =
  | 'RASCUNHO'
  | 'EM_REVISAO'
  | 'AGUARDANDO_ASSINATURA'
  | 'ASSINADO'
  | 'ATIVO'
  | 'ENCERRADO'
  | 'CANCELADO'

export type ApiContractType = 'RESIDENCIAL' | 'COMERCIAL' | 'TEMPORADA'

export type ApiAdjustmentIndex = 'IPCA' | 'IGPM' | 'INPC'

export type ApiContractGuaranteeType =
  'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'TITULO_CAPITALIZACAO'

export type ApiContractPartyRole = 'LOCADOR' | 'LOCATARIO' | 'FIADOR'

export type ApiSignatureStatus = 'PENDENTE' | 'ASSINADA'

export interface ApiContractParty {
  id: string
  role: ApiContractPartyRole
  name: string
  cpf: string
  email: string
  phone: string | null
  signatureStatus: ApiSignatureStatus
  signedAt: string | null
}

export interface ApiContractDocument {
  id: string
  name: string
  url: string | null
  createdAt: string
}

export interface ApiContract {
  id: string
  propertyId: string
  opportunityId: string
  code: string
  type: ApiContractType
  amount: number
  dueDay: number
  startDate: string
  endDate: string
  adjustmentIndex: ApiAdjustmentIndex
  guaranteeType: ApiContractGuaranteeType
  notes: string | null
  status: ApiContractStatus
  activatedAt: string | null
  createdAt: string
  updatedAt: string
  parties: ApiContractParty[]
  documents: ApiContractDocument[]
}

export interface ApiContractListItem {
  id: string
  code: string
  opportunityId: string
  propertyId: string
  propertyTitle: string
  propertyAddress: string
  ownerName: string | null
  tenantName: string | null
  status: ApiContractStatus
  type: ApiContractType
  amount: number
  startDate: string
  endDate: string
  updatedAt: string
}

export interface ContractListFilters {
  status?: ApiContractStatus
  type?: ApiContractType
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface ContractPartyInput {
  name: string
  cpf: string
  email: string
  phone: string | null
}

export interface CreateContractPayload {
  opportunityId: string
  type: ApiContractType
  dueDay: number
  startDate: string
  endDate: string
  adjustmentIndex: ApiAdjustmentIndex
  guaranteeType: ApiContractGuaranteeType
  notes: string | null
  owner: ContractPartyInput
  tenant: ContractPartyInput
  guarantor: ContractPartyInput | null
}

export interface ListContractsResponse {
  items: ApiContractListItem[]
  totalCount: number
}

export interface ContractResponse {
  contract: ApiContract
}
