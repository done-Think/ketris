import type { DashboardProperty, DashboardPropertyStatus } from '../types/dashboard-property'
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

function formatValueOrPlaceholder(value: number | null, suffix = ''): string {
  return value !== null ? `${formatPropertyCurrency(value)}${suffix}` : 'Não informado'
}

export function toDashboardProperty(property: Property): DashboardProperty {
  const isRent = property.purpose === 'RENT'
  const addressLine = property.address
    ? `${property.address.street}, ${property.address.number}`
    : 'Endereço não informado'
  const locationLine = property.address
    ? `${property.address.neighborhood}, ${property.address.city}`
    : ''
  const coverUrl = property.media[0]?.url ?? ''

  return {
    id: property.id,
    title: property.title,
    address: addressLine,
    location: locationLine,
    type: property.type,
    purpose: isRent ? 'Aluguel' : 'Venda',
    price: `${formatPropertyCurrency(property.values.price)}${isRent ? '/mês' : ''}`,
    status: statusByApiStatus[property.status],
    broker: '',
    updatedAt: formatPropertyRelativeDate(property.updatedAt, true),
    imageUrl: coverUrl,
    heroImageUrl: coverUrl,
    media: property.media.map((item) => ({
      url: item.url,
      label: item.type,
      kind: mediaKindByType[item.type] ?? 'Foto',
    })),
    summary: {
      bedrooms: property.characteristics.bedrooms?.toString() ?? 'Não informado',
      bathrooms: property.characteristics.bathrooms?.toString() ?? 'Não informado',
      parkingSpaces: property.characteristics.parkingSpots?.toString() ?? 'Não informado',
      area: formatPropertyArea(property.characteristics.areaM2),
      condominium: formatValueOrPlaceholder(property.values.condoFee),
      iptu: formatValueOrPlaceholder(property.values.propertyTax, '/mês'),
    },
    pricing: {
      rent: isRent ? `${formatPropertyCurrency(property.values.price)}/mês` : 'Não anunciado',
      sale: isRent ? 'Não anunciado' : formatPropertyCurrency(property.values.price),
      condominium: formatValueOrPlaceholder(property.values.condoFee),
      iptu: formatValueOrPlaceholder(property.values.propertyTax, '/mês'),
      administrationFee: 'Não informado',
      securityDeposit: 'Não informado',
      lastAdjustment: 'Não informado',
    },
    participants: [],
    activityHistory: buildActivityHistory(property),
  }
}

function buildActivityHistory(property: Property): DashboardProperty['activityHistory'] {
  const history: DashboardProperty['activityHistory'] = [
    {
      label: 'Cadastro do imóvel efetuado',
      date: formatPropertyRelativeDate(property.createdAt),
      tone: 'neutral',
    },
  ]

  if (property.publishedAt) {
    history.unshift({
      label: 'Imóvel publicado',
      date: formatPropertyRelativeDate(property.publishedAt),
      tone: 'success',
    })
  }

  if (property.updatedAt !== property.createdAt) {
    history.unshift({
      label: 'Imóvel atualizado',
      date: formatPropertyRelativeDate(property.updatedAt),
      tone: 'info',
    })
  }

  return history
}
