import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import type { PropertyFormValues, PropertyPurpose } from '../types/property'

export function toPropertyPayload(values: CreateDashboardPropertyFormValues): PropertyFormValues {
  const purpose: PropertyPurpose = values.purpose[0] === 'Venda' ? 'SALE' : 'RENT'

  return {
    title: values.title,
    description: values.description,
    purpose,
    type: values.type,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    parkingSpots: values.parkingSpaces,
    areaM2: values.area,
    price: values.mainValue,
    condoFee: values.condominium,
    propertyTax: values.iptu,
    address: {
      street: values.street,
      number: values.number,
      complement: null,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      latitude: null,
      longitude: null,
    },
  }
}
