import type { UserRole } from '@server/auth/domain/user.entity'
import type { CrmPropertyFilters } from './property'

export interface ListCrmPropertiesInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  filters: CrmPropertyFilters
}
export interface GetCrmPropertyInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  propertyId: string
}
