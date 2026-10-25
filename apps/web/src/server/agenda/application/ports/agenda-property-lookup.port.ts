import type {
  AgendaPropertyReference,
  AgendaRentedPropertyReference,
} from '../../types/property-reference'

export interface AgendaPropertyLookup {
  findAccessibleProperty(
    tenantId: string,
    propertyId: string,
    ownerUserId?: string,
  ): Promise<AgendaPropertyReference | null>
  findRentedProperty(
    userId: string,
    propertyId: string,
  ): Promise<AgendaRentedPropertyReference | null>
}
