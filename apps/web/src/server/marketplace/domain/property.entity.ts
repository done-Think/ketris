import type { PublishedPropertyDetail, PublicPropertyDetail } from '../types/property'

export function toPublicPropertyDetail(property: PublishedPropertyDetail): PublicPropertyDetail {
  return {
    id: property.id,
    title: property.title,
    purpose: property.purpose,
    propertyType: property.propertyType,
    price: property.price,
    condoFee: property.condoFee,
    propertyTax: property.propertyTax,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    area: property.area,
    city: property.city,
    neighborhood: property.neighborhood,
    latitude: property.latitude,
    longitude: property.longitude,
    brokerName: property.brokerName,
    brokerAvatarUrl: property.brokerAvatarUrl,
    coverUrl: property.coverUrl,
    publishedAt: property.publishedAt,
    description: property.description,
    address: property.address,
    media: property.media,
  }
}
