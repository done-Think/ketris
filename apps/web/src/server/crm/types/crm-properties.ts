import type { Papel } from '@server/auth/domain/user.entity'
import type { CrmPropertyFilters } from './property'

export interface ListCrmPropertiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  filters: CrmPropertyFilters
}
export interface GetCrmPropertyInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  propertyId: string
}
