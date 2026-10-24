import type { AppLocale } from '@/i18n/types/locale.types'
export type PropertyType =
  'apartment' | 'house' | 'studio' | 'penthouse' | 'commercial' | 'loft' | 'other'

export type ApiPropertyType =
  'APARTAMENTO' | 'CASA' | 'STUDIO' | 'COBERTURA' | 'COMERCIAL' | 'LOFT' | 'OUTRO'

export type PropertyAmenity = 'furnished' | 'gourmetBalcony' | 'petFriendly' | 'concierge24h'

export type ApiPropertyAmenity = 'MOBILIADO' | 'VARANDA_GOURMET' | 'ACEITA_PETS' | 'PORTARIA_24H'

export interface PropertyListing {
  amenities: PropertyAmenity[]
  negotiationTerms: string | null
  publishAfterReview: boolean
  allowWhatsappContact: boolean
  featured: boolean
}

export interface ApiPropertyListing {
  comodidades: ApiPropertyAmenity[]
  condicoesNegociacao: string | null
  publicarAposRevisao: boolean
  permiteContatoWhatsapp: boolean
  destaque: boolean
}

export type PropertyPurpose = 'RENT' | 'SALE' | 'BOTH'

export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'RENTED' | 'SOLD' | 'INACTIVE'

export interface PropertyAddress {
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
}

export interface PropertyMedia {
  id: string
  url: string
  type: string
  order: number
  createdAt: string
}

export interface PropertyMediaInput {
  url: string
  type?: string
  order?: number
}

export interface PropertyValues {
  price: number
  rentalPrice: number | null
  condoFee: number | null
  propertyTax: number | null
}

export interface PropertyCharacteristics {
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number | null
  areaM2: number | null
}

export interface Property {
  id: string
  tenantId: string
  responsibleUserId: string
  responsibleName: string
  activeContractId: string | null
  ownerUserId: string | null
  title: string
  description: string | null
  purpose: PropertyPurpose
  type: PropertyType
  status: PropertyStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  address: PropertyAddress | null
  media: PropertyMedia[]
  values: PropertyValues
  characteristics: PropertyCharacteristics
  listing: PropertyListing
}

export interface PropertyFormValues {
  ownerUserId?: string | null
  listing?: PropertyListing
  title: string
  description?: string | null
  purpose: PropertyPurpose
  type: PropertyType
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  areaM2?: number | null
  price: number
  rentalPrice?: number | null
  condoFee?: number | null
  propertyTax?: number | null
  address?: PropertyAddress
  media?: PropertyMediaInput[]
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
  status?: PropertyStatus
  purpose?: PropertyPurpose
}

export interface ApiPropertyAddress {
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

export interface ApiPropertyMedia {
  id: string
  url: string
  tipo: string
  ordem: number
  createdAt: string
}

export interface ApiProperty {
  anuncio: ApiPropertyListing
  id: string
  tenantId: string
  responsavelId: string
  responsavelNome: string
  activeContractId: string | null
  proprietarioId: string | null
  titulo: string
  descricao: string | null
  finalidade: 'ALUGUEL' | 'VENDA' | 'AMBOS'
  tipo: ApiPropertyType
  status: PropertyStatus
  publicadoEm: string | null
  createdAt: string
  updatedAt: string
  endereco: ApiPropertyAddress | null
  midias: ApiPropertyMedia[]
  valores: {
    valor: number
    valorAluguel: number | null
    condominio: number | null
    iptu: number | null
  }
  caracteristicas: {
    quartos: number | null
    banheiros: number | null
    vagas: number | null
    areaM2: number | null
  }
}

export interface PropertyOwnerOption {
  id: string
  name: string
}
export interface PropertyOwnersResponse {
  owners: PropertyOwnerOption[]
  pagination: PropertyPage['pagination']
}
export interface PropertyPayloadOptions {
  existingAddress?: PropertyAddress | null
  canChooseOwner?: boolean
}

export interface PropertyPage {
  properties: Property[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  counts: Record<PropertyStatus, number>
}
