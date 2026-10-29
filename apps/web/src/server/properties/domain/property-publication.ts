import type { Property } from '../types/property'

export function getPublishMissingFields(property: Property): string[] {
  const missingFields: string[] = []

  if (!property.title.trim()) missingFields.push('title')
  if (!property.type.trim()) missingFields.push('type')
  if (property.values.price <= 0) missingFields.push('price')
  if (!property.address) missingFields.push('address')
  if (property.media.length === 0) missingFields.push('media')

  return missingFields
}
