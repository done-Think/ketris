export type PropertyPurpose = 'ALUGUEL' | 'VENDA'

export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'RENTED' | 'SOLD' | 'INACTIVE'

export interface PropertyAddress {
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude: number | null
  longitude: number | null
}

export interface PropertyMedia {
  id: string
  url: string
  tipo: string
  ordem: number
  createdAt: Date
}

export interface PropertyMediaInput {
  url: string
  tipo?: string
  ordem?: number
}

export interface PropertyValues {
  valor: number
  condominio: number | null
  iptu: number | null
}

export interface PropertyCharacteristics {
  quartos: number | null
  banheiros: number | null
  vagas: number | null
  areaM2: number | null
}

export interface Property {
  id: string
  tenantId: string
  responsavelId: string
  titulo: string
  descricao: string | null
  finalidade: PropertyPurpose
  tipo: string
  status: PropertyStatus
  publicadoEm: Date | null
  createdAt: Date
  updatedAt: Date
  endereco: PropertyAddress | null
  midias: PropertyMedia[]
  valores: PropertyValues
  caracteristicas: PropertyCharacteristics
}

export interface NewProperty {
  tenantId: string
  responsavelId: string
  titulo: string
  descricao?: string | null
  finalidade: PropertyPurpose
  tipo: string
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  areaM2?: number | null
  valor: number
  condominio?: number | null
  iptu?: number | null
  endereco?: PropertyAddress
  midias?: PropertyMediaInput[]
}

export interface PropertyChanges {
  titulo?: string
  descricao?: string | null
  finalidade?: PropertyPurpose
  tipo?: string
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  areaM2?: number | null
  valor?: number
  condominio?: number | null
  iptu?: number | null
  endereco?: PropertyAddress
  midias?: PropertyMediaInput[]
}

export interface PropertyListFilters {
  tenantId: string
  status?: PropertyStatus
  finalidade?: PropertyPurpose
}

export interface ActiveContractProperty {
  contractId: string
  propertyId: string
  contractStatus: 'RASCUNHO' | 'AGUARDANDO_ASSINATURA' | 'ATIVO'
  finalidade: PropertyPurpose
}
