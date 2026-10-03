export type PropertyPurpose = 'RENT' | 'SALE'

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
  title: string
  description: string | null
  purpose: PropertyPurpose
  type: string
  status: PropertyStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  address: PropertyAddress | null
  media: PropertyMedia[]
  values: PropertyValues
  characteristics: PropertyCharacteristics
}

export interface PropertyFormValues {
  title: string
  description?: string | null
  purpose: PropertyPurpose
  type: string
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  areaM2?: number | null
  price: number
  condoFee?: number | null
  propertyTax?: number | null
  address?: PropertyAddress
  media?: PropertyMediaInput[]
}

export interface PropertyListFilters {
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
  id: string
  tenantId: string
  responsavelId: string
  titulo: string
  descricao: string | null
  finalidade: 'ALUGUEL' | 'VENDA'
  tipo: string
  status: PropertyStatus
  publicadoEm: string | null
  createdAt: string
  updatedAt: string
  endereco: ApiPropertyAddress | null
  midias: ApiPropertyMedia[]
  valores: { valor: number; condominio: number | null; iptu: number | null }
  caracteristicas: {
    quartos: number | null
    banheiros: number | null
    vagas: number | null
    areaM2: number | null
  }
}
