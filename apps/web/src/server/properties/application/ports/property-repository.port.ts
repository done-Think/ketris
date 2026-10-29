import type {
  ActiveContractProperty,
  NewProperty,
  Property,
  PropertyPage,
  PropertyChanges,
  PropertyListFilters,
  PropertyStatus,
  RentedProperty,
} from '../../types/property'

export interface PropertyRepository {
  create(property: NewProperty, actorId?: string): Promise<Property>
  listPage(filters: PropertyListFilters): Promise<PropertyPage>
  findByTenantAndId(
    tenantId: string,
    id: string,
    renterId?: string,
    ownerId?: string,
  ): Promise<Property | null>
  update(
    tenantId: string,
    id: string,
    changes: PropertyChanges,
    actorId?: string,
  ): Promise<Property | null>
  setStatus(
    tenantId: string,
    id: string,
    status: PropertyStatus,
    publishedAt: Date | null,
    actorId?: string,
  ): Promise<Property | null>
  findContractProperty(tenantId: string, contractId: string): Promise<ActiveContractProperty | null>
  findRenterContractProperty(renterId: string, propertyId: string): Promise<RentedProperty | null>
}
