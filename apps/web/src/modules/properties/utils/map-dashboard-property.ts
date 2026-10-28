import type {
  DashboardProperty,
  DashboardPropertyMappingMessages,
  PropertyFormatter,
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
  photo: 'photo',
  floorPlan: 'floorPlan',
  video: 'video',
}

const statusByApiStatus: Record<PropertyStatus, DashboardPropertyStatus> = {
  DRAFT: 'inReview',
  PUBLISHED: 'available',
  RENTED: 'rented',
  SOLD: 'sold',
  INACTIVE: 'inactive',
}

function formatValueOrPlaceholder(
  value: number | null,
  messages: DashboardPropertyMappingMessages,
  formatter: PropertyFormatter,
  suffix = '',
): string {
  return value !== null
    ? `${formatPropertyCurrency(value, formatter)}${suffix}`
    : messages.notInformed
}

export function toDashboardProperty(
  property: Property,
  options: DashboardPropertyMappingOptions,
): DashboardProperty {
  const { formatter, messages } = options
  const isRent = property.purpose === 'RENT'
  const isDualPurpose = property.purpose === 'BOTH'
  const formattedSalePrice = formatPropertyCurrency(property.values.price, formatter)
  const formattedRentPrice = property.values.rentalPrice
    ? `${formatPropertyCurrency(property.values.rentalPrice, formatter)}${messages.monthlySuffix}`
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
    activeContractId: property.activeContractId,
    apiStatus: property.status,
    title: property.title,
    description: property.description,
    listing: property.listing,
    address: addressLine,
    location: locationLine,
    type: messages.propertyTypes[property.type],
    purpose: isDualPurpose
      ? messages.purposes.sale
      : isRent
        ? messages.purposes.rent
        : messages.purposes.sale,
    price: isDualPurpose
      ? `${formattedSalePrice} · ${formattedRentPrice}`
      : `${formattedSalePrice}${isRent ? messages.monthlySuffix : ''}`,
    status: statusByApiStatus[property.status],
    broker: property.responsibleName,
    updatedAt: formatPropertyRelativeDate(property.updatedAt, formatter, true),
    imageUrl: coverUrl,
    heroImageUrl: coverUrl,
    media: property.media.map((item) => ({
      url: item.url,
      label: messages.mediaKinds[mediaKindByType[item.type] ?? 'photo'],
      kind: mediaKindByType[item.type] ?? 'photo',
    })),
    summary: {
      bedrooms: property.characteristics.bedrooms?.toString() ?? messages.notInformed,
      bathrooms: property.characteristics.bathrooms?.toString() ?? messages.notInformed,
      parkingSpaces: property.characteristics.parkingSpots?.toString() ?? messages.notInformed,
      area: formatPropertyArea(property.characteristics.areaSqm, messages.notInformed, formatter),
      condominium: formatValueOrPlaceholder(property.values.condoFee, messages, formatter),
      propertyTax: formatValueOrPlaceholder(
        property.values.propertyTax,
        messages,
        formatter,
        messages.monthlySuffix,
      ),
    },
    pricing: {
      rent: isRent
        ? `${formattedSalePrice}${messages.monthlySuffix}`
        : isDualPurpose
          ? formattedRentPrice
          : messages.notAnnounced,
      sale: isRent ? messages.notAnnounced : formattedSalePrice,
      condominium: formatValueOrPlaceholder(property.values.condoFee, messages, formatter),
      propertyTax: formatValueOrPlaceholder(
        property.values.propertyTax,
        messages,
        formatter,
        messages.monthlySuffix,
      ),
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
  const { formatter, messages } = options
  const history: DashboardProperty['activityHistory'] = [
    {
      label: messages.activity.created,
      date: formatPropertyRelativeDate(property.createdAt, formatter),
      tone: 'neutral',
    },
  ]

  if (property.publishedAt) {
    history.unshift({
      label: messages.activity.published,
      date: formatPropertyRelativeDate(property.publishedAt, formatter),
      tone: 'success',
    })
  }

  if (property.updatedAt !== property.createdAt) {
    history.unshift({
      label: messages.activity.updated,
      date: formatPropertyRelativeDate(property.updatedAt, formatter),
      tone: 'info',
    })
  }

  return history
}
