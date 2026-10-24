import type { AppLocale } from '@/i18n/types/locale.types'
export type PropertyType =
  'APARTAMENTO' | 'CASA' | 'STUDIO' | 'COBERTURA' | 'COMERCIAL' | 'LOFT' | 'OUTRO'

export type PropertyAmenity = 'MOBILIADO' | 'VARANDA_GOURMET' | 'ACEITA_PETS' | 'PORTARIA_24H'

export interface PropertyListing {
  comodidades: PropertyAmenity[]
  condicoesNegociacao: string | null
  publicarAposRevisao: boolean
  permiteContatoWhatsapp: boolean
  destaque: boolean
}

export type PropertyPurpose = 'ALUGUEL' | 'VENDA' | 'AMBOS'

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
  valorAluguel: number | null
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
  responsavelNome: string
  activeContractId: string | null
  id: string
  tenantId: string
  responsavelId: string
  proprietarioId: string | null
  titulo: string
  descricao: string | null
  finalidade: PropertyPurpose
  tipo: PropertyType
  anuncio: PropertyListing
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
  proprietarioId?: string | null
  titulo: string
  descricao?: string | null
  finalidade: PropertyPurpose
  tipo: PropertyType
  anuncio?: PropertyListing
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  areaM2?: number | null
  valor: number
  valorAluguel?: number | null
  condominio?: number | null
  iptu?: number | null
  endereco?: PropertyAddress
  midias?: PropertyMediaInput[]
}

export interface PropertyChanges {
  proprietarioId?: string | null
  titulo?: string
  descricao?: string | null
  finalidade?: PropertyPurpose
  tipo?: PropertyType
  anuncio?: PropertyListing
  quartos?: number | null
  banheiros?: number | null
  vagas?: number | null
  areaM2?: number | null
  valor?: number
  valorAluguel?: number | null
  condominio?: number | null
  iptu?: number | null
  endereco?: PropertyAddress
  midias?: PropertyMediaInput[]
}

export type PropertySortField =
  'title' | 'type' | 'saleValue' | 'rentalValue' | 'status' | 'broker' | 'updatedAt'

export interface PropertyListFilters {
  locale?: AppLocale
  sortBy?: PropertySortField
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  search?: string
  tenantId: string
  renterId?: string
  proprietarioId?: string
  status?: PropertyStatus
  finalidade?: PropertyPurpose
  responsavelId?: string
}

export interface RentedProperty {
  propertyId: string
  tenantId: string
}

export interface ActiveContractProperty {
  contractId: string
  propertyId: string
  contractStatus:
    | 'RASCUNHO'
    | 'EM_REVISAO'
    | 'AGUARDANDO_ASSINATURA'
    | 'ASSINADO'
    | 'ATIVO'
    | 'ENCERRADO'
    | 'CANCELADO'
  finalidade: PropertyPurpose
}

export interface PropertyOwnerOption {
  id: string
  name: string
}

export interface PropertyPage {
  properties: Property[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  counts: Record<PropertyStatus, number>
}

export interface PropertyOwnersPage {
  owners: PropertyOwnerOption[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export type PropertyAccessTarget = Pick<Property, 'responsavelId' | 'proprietarioId'>
