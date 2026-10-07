import type {
  DashboardProperty,
  DashboardPropertyMappingMessages,
  DashboardPropertyMappingOptions,
  DashboardPropertyStatus,
} from '../types/dashboard-property'
import type { Property, PropertyStatus } from '../types/property'
import {
  formatPropertyArea,
  formatPropertyCurrency,
  formatPropertyRelativeDate,
} from './format-property'

const mediaKindByType: Record<string, DashboardProperty['media'][number]['kind']> = {
  foto: 'Foto',
  planta: 'Planta',
  video: 'Vídeo',
}

const statusByApiStatus: Record<PropertyStatus, DashboardPropertyStatus> = {
  DRAFT: 'Em análise',
  PUBLISHED: 'Disponível',
  RENTED: 'Alugado',
  SOLD: 'Ativo',
  INACTIVE: 'Inativo',
}

const defaultMappingMessages: DashboardPropertyMappingMessages = {
  notAnnounced: 'Não anunciado',
  notInformed: 'Não informado',
  unknownAddress: 'Endereço não informado',
  monthlySuffix: '/mês',
  purposes: {
    rent: 'Aluguel',
    sale: 'Venda',
  },
  propertyTypes: {
    apartment: 'Apartamento',
    house: 'Casa',
    studio: 'Studio',
    penthouse: 'Cobertura',
    commercial: 'Comercial',
  },
  activity: {
    created: 'Cadastro do imóvel efetuado',
    published: 'Imóvel publicado',
    updated: 'Imóvel atualizado',
    contractLinked: 'Contrato ativo vinculado',
    photosUpdated: 'Fotos atualizadas',
    markedAsRented: 'Contrato marcado como alugado',
    proposalApproved: 'Proposta aprovada',
    activatedForSale: 'Imóvel ativado para venda',
    documentationSubmitted: 'Documentação enviada para análise',
    listingExpiringSoon: 'Publicação próxima do vencimento',
    markedAsInactive: 'Imóvel marcado como inativo',
    priceAdjustment: 'Ajuste de preço para {price}',
    visitScheduled: 'Visita agendada com {name}',
  },
  pricingDetails: {
    exempt: 'Isento',
    notApplicable: 'Não aplicável',
    insuranceDeposit: 'Seguro fiança',
    registrationPaused: 'Cadastro pausado',
    installmentsDeposit: '{count} aluguéis',
    feeOnRent: '{percent}% sobre aluguel',
    feeOnSale: '{percent}% na venda',
    noRecentAdjustment: 'Sem reajuste recente',
    underDocumentaryReview: 'Em análise documental',
    priceValidated: 'Preço validado',
    listingExpires: 'Publicação vence',
    deactivated: 'Inativado',
  },
}

const defaultMappingOptions: DashboardPropertyMappingOptions = {
  locale: 'pt-BR',
  messages: defaultMappingMessages,
}

function formatValueOrPlaceholder(
  value: number | null,
  messages: DashboardPropertyMappingMessages,
  suffix = '',
): string {
  return value !== null ? `${formatPropertyCurrency(value)}${suffix}` : messages.notInformed
}

export function translatePropertyType(
  type: string,
  messages: DashboardPropertyMappingMessages,
): string {
  const normalizedType = type.trim().toLocaleLowerCase('pt-BR')
  const propertyTypeByValue: Record<string, string> = {
    apartamento: messages.propertyTypes.apartment,
    casa: messages.propertyTypes.house,
    studio: messages.propertyTypes.studio,
    cobertura: messages.propertyTypes.penthouse,
    comercial: messages.propertyTypes.commercial,
  }

  return propertyTypeByValue[normalizedType] ?? type
}

export function toDashboardProperty(
  property: Property,
  options: DashboardPropertyMappingOptions = defaultMappingOptions,
): DashboardProperty {
  const { locale, messages } = options
  const isRent = property.purpose === 'RENT'
  const isDualPurpose = property.purpose === 'BOTH'
  const formattedSalePrice = formatPropertyCurrency(property.values.price)
  const formattedRentPrice = property.values.rentalPrice
    ? `${formatPropertyCurrency(property.values.rentalPrice)}${messages.monthlySuffix}`
    : messages.notAnnounced
  const addressLine = property.address
    ? `${property.address.street}, ${property.address.number}`
    : messages.unknownAddress
  const locationLine = property.address
    ? `${property.address.neighborhood}, ${property.address.city}`
    : ''
  const coverUrl = property.media[0]?.url ?? ''

  return {
    id: property.id,
    responsibleUserId: property.responsibleUserId,
    apiStatus: property.status,
    title: property.title,
    address: addressLine,
    location: locationLine,
    type: translatePropertyType(property.type, messages),
    purpose: isDualPurpose
      ? messages.purposes.sale
      : isRent
        ? messages.purposes.rent
        : messages.purposes.sale,
    price: isDualPurpose
      ? `${formattedSalePrice} · ${formattedRentPrice}`
      : `${formattedSalePrice}${isRent ? messages.monthlySuffix : ''}`,
    status: statusByApiStatus[property.status],
    broker: '',
    updatedAt: formatPropertyRelativeDate(property.updatedAt, locale, true),
    imageUrl: coverUrl,
    heroImageUrl: coverUrl,
    media: property.media.map((item) => ({
      url: item.url,
      label: item.type,
      kind: mediaKindByType[item.type] ?? 'Foto',
    })),
    summary: {
      bedrooms: property.characteristics.bedrooms?.toString() ?? messages.notInformed,
      bathrooms: property.characteristics.bathrooms?.toString() ?? messages.notInformed,
      parkingSpaces: property.characteristics.parkingSpots?.toString() ?? messages.notInformed,
      area: formatPropertyArea(property.characteristics.areaM2, messages.notInformed),
      condominium: formatValueOrPlaceholder(property.values.condoFee, messages),
      iptu: formatValueOrPlaceholder(property.values.propertyTax, messages, messages.monthlySuffix),
    },
    pricing: {
      rent: isRent
        ? `${formattedSalePrice}${messages.monthlySuffix}`
        : isDualPurpose
          ? formattedRentPrice
          : messages.notAnnounced,
      sale: isRent ? messages.notAnnounced : formattedSalePrice,
      condominium: formatValueOrPlaceholder(property.values.condoFee, messages),
      iptu: formatValueOrPlaceholder(property.values.propertyTax, messages, messages.monthlySuffix),
      administrationFee: messages.notInformed,
      securityDeposit: messages.notInformed,
      lastAdjustment: messages.notInformed,
    },
    participants: [],
    activityHistory: buildActivityHistory(property, options),
  }
}

function buildActivityHistory(
  property: Property,
  options: DashboardPropertyMappingOptions,
): DashboardProperty['activityHistory'] {
  const { locale, messages } = options
  const history: DashboardProperty['activityHistory'] = [
    {
      label: messages.activity.created,
      date: formatPropertyRelativeDate(property.createdAt, locale),
      tone: 'neutral',
    },
  ]

  if (property.publishedAt) {
    history.unshift({
      label: messages.activity.published,
      date: formatPropertyRelativeDate(property.publishedAt, locale),
      tone: 'success',
    })
  }

  if (property.updatedAt !== property.createdAt) {
    history.unshift({
      label: messages.activity.updated,
      date: formatPropertyRelativeDate(property.updatedAt, locale),
      tone: 'info',
    })
  }

  return history
}
