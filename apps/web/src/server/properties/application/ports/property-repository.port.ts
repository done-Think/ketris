import type {
  ActiveContractProperty,
  NewProperty,
  Property,
  PropertyChanges,
  PropertyListFilters,
  PropertyStatus,
} from '../../domain/property.entity'

export interface PropertyRepository {
  create(property: NewProperty): Promise<Property>
  list(filters: PropertyListFilters): Promise<Property[]>
  findByTenantAndId(tenantId: string, id: string): Promise<Property | null>
  update(tenantId: string, id: string, changes: PropertyChanges): Promise<Property | null>
  setStatus(
    tenantId: string,
    id: string,
    status: PropertyStatus,
    publishedAt: Date | null,
  ): Promise<Property | null>
  findContractProperty(tenantId: string, contractId: string): Promise<ActiveContractProperty | null>
}
