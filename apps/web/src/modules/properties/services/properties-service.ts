import { BaseService } from '@shared/lib/api/base-service'

import type {
  Property,
  PropertyAddress,
  PropertyFormValues,
  PropertyListFilters,
  PropertyMediaInput,
  PropertyPurpose,
  PropertyStatus,
} from '../types/property'

interface ApiPropertyAddress {
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

interface ApiPropertyMedia {
  id: string
  url: string
  tipo: string
  ordem: number
  createdAt: string
}

interface ApiProperty {
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

interface PropertyResponse {
  property: ApiProperty
}

interface PropertiesResponse {
  properties: ApiProperty[]
}

function toApiPurpose(purpose: PropertyPurpose): 'ALUGUEL' | 'VENDA' {
  return purpose === 'RENT' ? 'ALUGUEL' : 'VENDA'
}

function fromApiPurpose(purpose: 'ALUGUEL' | 'VENDA'): PropertyPurpose {
  return purpose === 'ALUGUEL' ? 'RENT' : 'SALE'
}

function toApiAddress(address: PropertyAddress) {
  return {
    logradouro: address.street,
    numero: address.number,
    complemento: address.complement,
    bairro: address.neighborhood,
    cidade: address.city,
    estado: address.state,
    cep: address.zipCode,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function fromApiAddress(address: ApiPropertyAddress | null): PropertyAddress | null {
  if (!address) return null

  return {
    street: address.logradouro,
    number: address.numero,
    complement: address.complemento,
    neighborhood: address.bairro,
    city: address.cidade,
    state: address.estado,
    zipCode: address.cep,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function toApiMedia(media: PropertyMediaInput[] | undefined) {
  if (!media) return undefined

  return media.map((item) => ({ url: item.url, tipo: item.type, ordem: item.order }))
}

function fromApiMedia(media: ApiPropertyMedia[]): Property['media'] {
  return media.map((item) => ({
    id: item.id,
    url: item.url,
    type: item.tipo,
    order: item.ordem,
    createdAt: item.createdAt,
  }))
}

function mapProperty(api: ApiProperty): Property {
  return {
    id: api.id,
    tenantId: api.tenantId,
    responsibleUserId: api.responsavelId,
    title: api.titulo,
    description: api.descricao,
    purpose: fromApiPurpose(api.finalidade),
    type: api.tipo,
    status: api.status,
    publishedAt: api.publicadoEm,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    address: fromApiAddress(api.endereco),
    media: fromApiMedia(api.midias),
    values: {
      price: api.valores.valor,
      condoFee: api.valores.condominio,
      propertyTax: api.valores.iptu,
    },
    characteristics: {
      bedrooms: api.caracteristicas.quartos,
      bathrooms: api.caracteristicas.banheiros,
      parkingSpots: api.caracteristicas.vagas,
      areaM2: api.caracteristicas.areaM2,
    },
  }
}

function toCreatePayload(values: PropertyFormValues) {
  return {
    titulo: values.title,
    descricao: values.description ?? null,
    finalidade: toApiPurpose(values.purpose),
    tipo: values.type,
    quartos: values.bedrooms ?? null,
    banheiros: values.bathrooms ?? null,
    vagas: values.parkingSpots ?? null,
    areaM2: values.areaM2 ?? null,
    valor: values.price,
    condominio: values.condoFee ?? null,
    iptu: values.propertyTax ?? null,
    endereco: values.address ? toApiAddress(values.address) : undefined,
    midias: toApiMedia(values.media),
  }
}

function toUpdatePayload(payload: Partial<PropertyFormValues>) {
  const body: Record<string, unknown> = {}

  if (payload.title !== undefined) body.titulo = payload.title
  if (payload.description !== undefined) body.descricao = payload.description
  if (payload.purpose !== undefined) body.finalidade = toApiPurpose(payload.purpose)
  if (payload.type !== undefined) body.tipo = payload.type
  if (payload.bedrooms !== undefined) body.quartos = payload.bedrooms
  if (payload.bathrooms !== undefined) body.banheiros = payload.bathrooms
  if (payload.parkingSpots !== undefined) body.vagas = payload.parkingSpots
  if (payload.areaM2 !== undefined) body.areaM2 = payload.areaM2
  if (payload.price !== undefined) body.valor = payload.price
  if (payload.condoFee !== undefined) body.condominio = payload.condoFee
  if (payload.propertyTax !== undefined) body.iptu = payload.propertyTax
  if (payload.address !== undefined) body.endereco = toApiAddress(payload.address)
  if (payload.media !== undefined) body.midias = toApiMedia(payload.media)

  return body
}

export class PropertiesService extends BaseService {
  private readonly path = '/properties'

  list(filters: PropertyListFilters = {}): Promise<Property[]> {
    const params = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.purpose ? { finalidade: toApiPurpose(filters.purpose) } : {}),
    }

    return this.http
      .get<PropertiesResponse>(this.path, { params })
      .then((data) => data.properties.map(mapProperty))
  }

  getById(id: string): Promise<Property> {
    return this.http
      .get<PropertyResponse>(`${this.path}/${id}`)
      .then((data) => mapProperty(data.property))
  }

  create(payload: PropertyFormValues): Promise<Property> {
    return this.http
      .post<PropertyResponse>(this.path, toCreatePayload(payload))
      .then((data) => mapProperty(data.property))
  }

  update(id: string, payload: Partial<PropertyFormValues>): Promise<Property> {
    return this.http
      .patch<PropertyResponse>(`${this.path}/${id}`, toUpdatePayload(payload))
      .then((data) => mapProperty(data.property))
  }

  publish(id: string): Promise<Property> {
    return this.http
      .post<PropertyResponse>(`${this.path}/${id}/publish`)
      .then((data) => mapProperty(data.property))
  }

  unpublish(id: string): Promise<Property> {
    return this.http
      .post<PropertyResponse>(`${this.path}/${id}/unpublish`)
      .then((data) => mapProperty(data.property))
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/${id}`)
  }
}

export const propertiesService = new PropertiesService()
