import { createPropertySteps, createPropertyTypeOptions } from '../config/dashboard-property-ui'
import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../types/dashboard-property'
import type { Property } from '../types/property'

function toDashboardPurpose(purpose: Property['purpose']): CreatePropertyPurpose[] {
  return purpose === 'SALE' ? ['Venda'] : ['Aluguel']
}

function toDashboardType(type: string): string {
  return createPropertyTypeOptions.includes(type) ? type : createPropertyTypeOptions[0]
}

export function buildEditPropertyFormValues(property: Property): CreateDashboardPropertyFormValues {
  return {
    activeStepIndex: 0,
    maxVisitedStepIndex: createPropertySteps.length - 1,
    type: toDashboardType(property.type),
    purpose: toDashboardPurpose(property.purpose),
    title: property.title,
    description: property.description ?? '',
    street: property.address?.street ?? '',
    number: property.address?.number ?? '',
    neighborhood: property.address?.neighborhood ?? '',
    city: property.address?.city ?? '',
    state: property.address?.state ?? '',
    zipCode: property.address?.zipCode ?? '',
    bedrooms: property.characteristics.bedrooms ?? 0,
    bathrooms: property.characteristics.bathrooms ?? 0,
    parkingSpaces: property.characteristics.parkingSpots ?? 0,
    area: property.characteristics.areaM2 ?? 0,
    features: [],
    media: property.media.map((item) => ({ url: item.url, type: item.type, order: item.order })),
    mainValue: property.values.price,
    condominium: property.values.condoFee ?? 0,
    iptu: property.values.propertyTax ?? 0,
    negotiationTerm: 'A combinar',
    publishingOptions: [],
  }
}
