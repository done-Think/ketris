import type { PropertyOwnerOption, PropertyOwnersPage } from '../../types/property'

export interface PropertyOwnerDirectory {
  findActiveOwner(tenantId: string, id: string): Promise<PropertyOwnerOption | null>
  listActiveOwners(tenantId: string, page: number, pageSize: number): Promise<PropertyOwnersPage>
}
