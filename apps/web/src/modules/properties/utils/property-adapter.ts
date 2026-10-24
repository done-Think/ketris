import type {
  ApiProperty,
  ApiPropertyType,
  ApiPropertyAmenity,
  PropertyType,
  PropertyAmenity,
  ApiPropertyAddress,
  ApiPropertyMedia,
  Property,
  PropertyAddress,
  PropertyFormValues,
  PropertyListing,
  PropertyMediaInput,
  PropertyPurpose,
} from '../types/property'

const propertyTypeToApi: Record<PropertyType, ApiPropertyType> = {
  apartment: 'APARTAMENTO',
  house: 'CASA',
  studio: 'STUDIO',
  penthouse: 'COBERTURA',
  commercial: 'COMERCIAL',
  loft: 'LOFT',
  other: 'OUTRO',
}

const propertyTypeFromApi: Record<ApiPropertyType, PropertyType> = {
  APARTAMENTO: 'apartment',
  CASA: 'house',
  STUDIO: 'studio',
  COBERTURA: 'penthouse',
  COMERCIAL: 'commercial',
  LOFT: 'loft',
  OUTRO: 'other',
}

const amenityToApi: Record<PropertyAmenity, ApiPropertyAmenity> = {
  furnished: 'MOBILIADO',
  gourmetBalcony: 'VARANDA_GOURMET',
  petFriendly: 'ACEITA_PETS',
  concierge24h: 'PORTARIA_24H',
}

const amenityFromApi: Record<ApiPropertyAmenity, PropertyAmenity> = {
  MOBILIADO: 'furnished',
  VARANDA_GOURMET: 'gourmetBalcony',
  ACEITA_PETS: 'petFriendly',
  PORTARIA_24H: 'concierge24h',
}

function toApiListing(listing: PropertyListing) {
  return {
    comodidades: listing.amenities.map((amenity) => amenityToApi[amenity]),
    condicoesNegociacao: listing.negotiationTerms,
    publicarAposRevisao: listing.publishAfterReview,
    permiteContatoWhatsapp: listing.allowWhatsappContact,
    destaque: listing.featured,
  }
}

export function toApiPurpose(purpose: PropertyPurpose): 'ALUGUEL' | 'VENDA' | 'AMBOS' {
  if (purpose === 'BOTH') return 'AMBOS'

  return purpose === 'RENT' ? 'ALUGUEL' : 'VENDA'
}

function fromApiPurpose(purpose: 'ALUGUEL' | 'VENDA' | 'AMBOS'): PropertyPurpose {
  if (purpose === 'AMBOS') return 'BOTH'

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

export function mapProperty(api: ApiProperty): Property {
  return {
    id: api.id,
    tenantId: api.tenantId,
    responsibleUserId: api.responsavelId,
    responsibleName: api.responsavelNome,
    activeContractId: api.activeContractId,
    ownerUserId: api.proprietarioId,
    title: api.titulo,
    description: api.descricao,
    purpose: fromApiPurpose(api.finalidade),
    type: propertyTypeFromApi[api.tipo],
    listing: {
      amenities: api.anuncio.comodidades.map((amenity) => amenityFromApi[amenity]),
      negotiationTerms: api.anuncio.condicoesNegociacao,
      publishAfterReview: api.anuncio.publicarAposRevisao,
      allowWhatsappContact: api.anuncio.permiteContatoWhatsapp,
      featured: api.anuncio.destaque,
    },
    status: api.status,
    publishedAt: api.publicadoEm,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    address: fromApiAddress(api.endereco),
    media: fromApiMedia(api.midias),
    values: {
      price: api.valores.valor,
      rentalPrice: api.valores.valorAluguel,
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

export function toCreatePayload(values: PropertyFormValues) {
  return {
    proprietarioId: values.ownerUserId,
    titulo: values.title,
    descricao: values.description ?? null,
    finalidade: toApiPurpose(values.purpose),
    tipo: propertyTypeToApi[values.type],
    anuncio: values.listing ? toApiListing(values.listing) : undefined,
    quartos: values.bedrooms ?? null,
    banheiros: values.bathrooms ?? null,
    vagas: values.parkingSpots ?? null,
    areaM2: values.areaM2 ?? null,
    valor: values.price,
    valorAluguel: values.rentalPrice ?? null,
    condominio: values.condoFee ?? null,
    iptu: values.propertyTax ?? null,
    endereco: values.address ? toApiAddress(values.address) : undefined,
    midias: toApiMedia(values.media),
  }
}

export function toUpdatePayload(payload: Partial<PropertyFormValues>) {
  const body: Record<string, unknown> = {}

  if (payload.ownerUserId !== undefined) body.proprietarioId = payload.ownerUserId
  if (payload.listing !== undefined) body.anuncio = toApiListing(payload.listing)
  if (payload.title !== undefined) body.titulo = payload.title
  if (payload.description !== undefined) body.descricao = payload.description
  if (payload.purpose !== undefined) body.finalidade = toApiPurpose(payload.purpose)
  if (payload.type !== undefined) body.tipo = propertyTypeToApi[payload.type]
  if (payload.bedrooms !== undefined) body.quartos = payload.bedrooms
  if (payload.bathrooms !== undefined) body.banheiros = payload.bathrooms
  if (payload.parkingSpots !== undefined) body.vagas = payload.parkingSpots
  if (payload.areaM2 !== undefined) body.areaM2 = payload.areaM2
  if (payload.price !== undefined) body.valor = payload.price
  if (payload.rentalPrice !== undefined) body.valorAluguel = payload.rentalPrice
  if (payload.condoFee !== undefined) body.condominio = payload.condoFee
  if (payload.propertyTax !== undefined) body.iptu = payload.propertyTax
  if (payload.address !== undefined) body.endereco = toApiAddress(payload.address)
  if (payload.media !== undefined) body.midias = toApiMedia(payload.media)

  return body
}
