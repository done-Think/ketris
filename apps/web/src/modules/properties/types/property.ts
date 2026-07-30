import type { PropertyFormValues } from '../schemas/property-schema'

export interface Property extends PropertyFormValues {
  id: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
